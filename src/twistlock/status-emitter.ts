import { inject, injectable } from "inversify";
import { ConfigurationService } from "../configuration";
import EventBus from "../core/event/event-bus";
import { NotificationEvent } from "../core/event/event-model";
import { Swingletree } from "../core/model";
import { TemplateEngine, Templates } from "../core/template/template-engine";
import { TwistlockConfig } from "./config";
import { TwistlockEvents, TwistlockReportReceivedEvent } from "./events";
import { TwistlockModel } from "./model";

@injectable()
class TwistlockStatusEmitter {
	private readonly eventBus: EventBus;
	private readonly templateEngine: TemplateEngine;
	private readonly context: string;

	constructor(
		@inject(EventBus) eventBus: EventBus,
		@inject(ConfigurationService) configurationService: ConfigurationService,
		@inject(TemplateEngine) templateEngine: TemplateEngine
	) {
		this.eventBus = eventBus;
		this.templateEngine = templateEngine;
		this.context = configurationService.get(TwistlockConfig.CONTEXT);

		eventBus.register(TwistlockEvents.TwistlockReportReceived, this.reportReceivedHandler, this);
	}


	private getConclusion(event: TwistlockReportReceivedEvent): Swingletree.Conclusion {
		let conclusion = Swingletree.Conclusion.PASSED;
		if (event.report.results && event.report.results.length > 0) {
			event.report.results.forEach((result) => {
				if (result.complianceDistribution.total + result.vulnerabilityDistribution.total > 0) {
					conclusion = Swingletree.Conclusion.BLOCKED;
				}
			});
		}

		return conclusion;
	}

	public reportReceivedHandler(event: TwistlockReportReceivedEvent) {

		const config = new TwistlockModel.DefaultRepoConfig(event.getPluginConfig<TwistlockModel.RepoConfig>("twistlock"));
		const issueReport = new TwistlockModel.util.FindingReport(
			event.report,
			config.thresholdCvss,
			config.thresholdCompliance,
			config.whitelist
		);

		const templateData: TwistlockModel.Template = {
			report: event.report,
			issues: issueReport
		};

		const annotations: Swingletree.ProjectAnnotation[] = [];
		issueReport.complianceIssues.forEach(issue => {
			const annotation = new Swingletree.ProjectAnnotation();
			annotation.title = issue.title;
			annotation.severity = TwistlockModel.SeverityUtil.convertCompliance(issue.severity);

			annotations.push(annotation);
		});

		issueReport.vulnerabilityIssues.forEach(issue => {
			const annotation = new Swingletree.ProjectAnnotation();
			annotation.title = issue.id;
			annotation.href = issue.link;
			annotation.severity = TwistlockModel.SeverityUtil.convertVulnerability(issue.severity);
			annotation.metadata = {
				vector: issue.vector,
				status: issue.status,
				package: issue.packageName,
				version: issue.packageVersion,
				cvss: issue.cvss
			};

			annotations.push(annotation);
		});

		const notificationData: Swingletree.AnalysisReport = {
			sender: this.context,
			source: event.source,
			checkStatus: this.getConclusion(event),
			title: `${issueReport.issuesCount()} issues found`,
			annotations: annotations
		};

		const notificationEvent = new NotificationEvent(notificationData);
		notificationEvent.markdown = this.templateEngine.template<TwistlockModel.Template>(
			Templates.TWISTLOCK_SCAN,
			templateData
		);

		this.eventBus.emit(notificationEvent);
	}
}

export default TwistlockStatusEmitter;