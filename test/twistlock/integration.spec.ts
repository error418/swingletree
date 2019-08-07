"use strict";

import { suite, test, describe } from "mocha";
import { expect, assert } from "chai";
import * as chai from "chai";
import * as sinon from "sinon";
chai.use(require("sinon-chai"));
chai.use(require("chai-as-promised"));

import TwistlockStatusEmitter from "../../src/twistlock/status-emitter";
import { EventBusMock, ConfigurationServiceMock, InstallationStorageMock, TemplateEngineMock } from "../mock-classes";
import { TwistlockReportReceivedEvent } from "../../src/twistlock/events";
import { Events } from "../../src/core/event/event-model";


const sandbox = sinon.createSandbox();

describe("Twistlock", () => {

	describe("status emitter", () => {
		it("should mark check run with action required on dirty report", async () => {
			const eventBusMock = new EventBusMock();

			const uut = new TwistlockStatusEmitter(
				eventBusMock,
				new ConfigurationServiceMock(),
				new TemplateEngineMock()
			);

			const event = new TwistlockReportReceivedEvent(
				require("../mock/twistlock-report-all.json"),
				"org",
				"repo"
			);

			uut.reportReceivedHandler(event);

			sinon.assert.calledOnce(eventBusMock.emit as any);

			sinon.assert.calledWith(eventBusMock.emit as any, sinon.match.has("eventType", Events.GithubCheckRunWriteEvent));
			sinon.assert.calledWith(eventBusMock.emit as any, sinon.match.hasNested("payload.conclusion", sinon.match("action_required")));
		});

		it("should mark check run with success on clean report", async () => {
			const eventBusMock = new EventBusMock();

			const uut = new TwistlockStatusEmitter(
				eventBusMock,
				new ConfigurationServiceMock(),
				new TemplateEngineMock()
			);

			const event = new TwistlockReportReceivedEvent(
				require("../mock/twistlock-report-clean.json"),
				"org",
				"repo"
			);

			uut.reportReceivedHandler(event);

			sinon.assert.calledOnce(eventBusMock.emit as any);

			sinon.assert.calledWith(eventBusMock.emit as any, sinon.match.has("eventType", Events.GithubCheckRunWriteEvent));
			sinon.assert.calledWith(eventBusMock.emit as any, sinon.match.hasNested("payload.conclusion", sinon.match("success")));
		});
	});

});