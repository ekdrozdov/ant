import {} from "@pixi/layout";
import { FancyButton } from "@pixi/ui";
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
			},
			styles: {
				position: "centerTop",
				background: "#959d90",
				padding: 5,
				margin: 5,
			},
		});
	}
}
