import { injectable, inject } from "inversify";
import * as express from "express";
import bodyParser = require("body-parser");
import * as compression from "compression";
import { LOGGER } from "../logger";
import { ConfigurationService } from "../configuration";
import { AppConfig } from "./core-config";

@injectable()
export class WebServer {
	private app: express.Express;

	private port: number;

	constructor(@inject(ConfigurationService) configService: ConfigurationService) {
		this.app = express();

		this.port = configService.getNumber(AppConfig.PORT);

		this.initialize();
	}

	private initialize() {
		// express configuration
		this.app.set("port", this.port);
		this.app.use(compression());
		this.app.use(bodyParser.json());
		this.app.use(bodyParser.urlencoded({ extended: true }));

		// set rendering engine
		this.app.set("view engine", "pug");

		// health endpoint
		this.app.get("/health", (request: express.Request, response: express.Response) => {
			response.sendStatus(200);
		});

		// error handling
		this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
			// only provide error details in development mode
			const visibleError = req.app.get("env") === "development" ? err : {};

			res.status(err.status || 500);
			res.send(visibleError);
		});

		// kickstart everything
		this.app.listen(this.app.get("port"), () => {
			LOGGER.info("listening on http://localhost:%d in %s mode", this.app.get("port"), this.app.get("env"));
		});
	}

	public addRouter(path: string, router: express.Router) {
		LOGGER.debug("adding http endpoint %s", path);
		this.app.use(path, router);
	}

	public setLocale(key: string, data: any) {
		LOGGER.debug("adding locals entry for key %s", key);
		this.app.locals[key] = data;
	}
}