import { type ButtonOptions, FancyButton } from "@pixi/ui";

export class TextButton extends FancyButton {
	constructor(options?: ButtonOptions) {
		super({
			defaultTextAnchor: { x: 0, y: 0 },
			animations: {
				// animations config for button states
				hover: {
					// animation for hover state
					props: {
						// props to animate
						scale: { x: 1.03, y: 1.03 }, // scale up button on hover
					},
					duration: 100, // animation duration
				},
				pressed: {
					// animation for pressed state
					props: {
						// props to animate
						scale: { x: 0.95, y: 0.95 }, // scale down button on press
					},
					duration: 100, // animation duration
				},
			},
			...options,
		});
	}
}
