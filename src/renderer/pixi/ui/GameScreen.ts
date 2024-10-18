import {} from "@pixi/layout";
import { FancyButton } from "@pixi/ui";
import {
	DOUBLE_SPEED_ACTION_ID,
	HALF_SPEED_ACTION_ID,
	PAUSE_ACTION_ID,
	RESUME_ACTION_ID,
	actionRegistry,
} from "../../../controller/actions";
import { AppScreen } from "./AppScreen";
import { TextButton } from "./pixi-ui-wrappers/Button";

// Game overlay:
// addContent(timePanel)
// addContent(selectorPanel)

/**
 * Game screen.
 * To be used to show all the game play and UI.
 */
export class GameScreen extends AppScreen {
	constructor() {
		super("GameScreen");
	}

	public override async init(): Promise<void> {}

	showOverlay() {
		const pauseButton = new TextButton({
			text: "pause",
		});
		pauseButton.onPress.connect(() => {
			actionRegistry.execute(PAUSE_ACTION_ID);
		});
		const resumeButton = new TextButton({
			text: "resume",
		});
		resumeButton.onPress.connect(() => {
			actionRegistry.execute(RESUME_ACTION_ID);
		});
		const halfSpeedButton = new TextButton({
			text: "-",
		});
		halfSpeedButton.onPress.connect(()=> {
			actionRegistry.execute(HALF_SPEED_ACTION_ID)
		})
		const doubleSpeedButton = new TextButton({
			text: "+",
		});
		doubleSpeedButton.onPress.connect(() => {
			actionRegistry.execute(DOUBLE_SPEED_ACTION_ID);
		});
		// Top panel overlay.
		this.addContent({
			content: {
				pause: {
					content: pauseButton,
					styles: {
						background: "brown",
						marginLeft: 10,
						marginRight: 10,
					},
				},
				resume: {
					content: resumeButton,
					styles: {
						background: "brown",
						marginLeft: 10,
						marginRight: 10,
					},
				},
				halfSpeed: {
					content: halfSpeedButton,
					styles: {
						background: "brown",
						marginLeft: 10,
						marginRight: 10,
						width: 30,
					},
				},
				doubleSpeed: {
					content: doubleSpeedButton,
					styles: {
						background: "brown",
						marginLeft: 10,
						marginRight: 10,
						width: 30,
					},
				},
			},
			styles: {
				position: "centerTop",
				background: "#959d90",
				padding: 5,
				margin: 5,
			},
		});

		// Left panel overlay.
		// TODO: use radio group
		this.addContent({
			content: {
				spawn: {
					content: new TextButton({
						text: "spawn",
					}),
					styles: {
						background: "brown",
						marginLeft: 10,
						marginRight: 10,
					},
				},
				remove: {
					content: new TextButton({
						text: "remove",
					}),
					styles: {
						background: "brown",
						marginLeft: 10,
						marginRight: 10,
					},
				},
			},
			styles: {
				// TODO: arrange by column
				position: "leftCenter",
				background: "#959d90",
				padding: 5,
				margin: 5,
			},
		});

		// Bottom panel overlay.
		this.addContent({
			content: {
				prev: {
					content: new TextButton({
						text: "<",
						defaultTextAnchor: { x: 0, y: 0 },
					}),
					styles: {
						background: "brown",
						marginLeft: 10,
						marginRight: 10,
						width: 30,
					},
				},
				selected: {
					content: new TextButton({
						text: "selected",
					}),
					styles: {
						background: "brown",
						marginLeft: 10,
						marginRight: 10,
						width: 30,
					},
				},
				next: {
					content: new TextButton({
						text: ">",
					}),
					styles: {
						background: "brown",
						marginLeft: 10,
						marginRight: 10,
						width: 30,
					},
				},
			},
			styles: {
				position: "centerBottom",
				background: "#959d90",
				padding: 5,
				margin: 5,
			},
		});
	}
}
