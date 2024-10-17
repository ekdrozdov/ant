import {} from "@pixi/layout";
import { FancyButton, Input } from "@pixi/ui";
import { AppScreen } from "./AppScreen";

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

	public override async init(): Promise<void> {
		// Top panel overlay.
		this.addContent({
			content: {
				pause: {
					content: new FancyButton({
						text: "pause",
						defaultTextAnchor: { x: 0, y: 0 },
					}),
					styles: {
						background: "brown",
						marginLeft: 10,
						marginRight: 10,
					},
				},
				play: {
					content: new FancyButton({
						text: "play",
						defaultTextAnchor: { x: 0, y: 0 },
					}),
					styles: {
						background: "brown",
						marginLeft: 10,
						marginRight: 10,
					},
				},
				freq: {
					content: new Input({
						placeholder: "freq",
						bg: "white",
						// defaultTextAnchor: { x: 0, y: 0 },
					}),
					value: "1",
					styles: {
						background: "brown",
						marginLeft: 10,
						marginRight: 10,
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
					content: new FancyButton({
						text: "spawn",
						defaultTextAnchor: { x: 0, y: 0 },
					}),
					styles: {
						background: "brown",
						marginLeft: 10,
						marginRight: 10,
					},
				},
				remove: {
					content: new FancyButton({
						text: "remove",
						defaultTextAnchor: { x: 0, y: 0 },
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
				pause: {
					content: new FancyButton({
						text: "pause",
						defaultTextAnchor: { x: 0, y: 0 },
					}),
					styles: {
						background: "brown",
						marginLeft: 10,
						marginRight: 10,
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
