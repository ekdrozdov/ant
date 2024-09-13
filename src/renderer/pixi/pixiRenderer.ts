import { Viewport } from "pixi-viewport";
import { Application, type DisplayObject, Sprite } from "pixi.js";
import type { SceneObject } from "../../game/scene/scene";
import type { World } from "../../game/world";
import type { MenuRegistry } from "../../ui/menu";
import type { Disposable } from "../../utils/lifecycle";
import { type Renderer, RendererBase } from "../renderer";

const kindToSprite = {
	mark: "http://localhost:5173/assets/mark.png",
	bunny: "http://localhost:5173/assets/bunny.png",
	tree: "http://localhost:5173/assets/tree.png",
	"animal-source": "http://localhost:5173/assets/animal-source.png",
	"tree-source": "http://localhost:5173/assets/tree-source.png",
} as const;

export class PixiRenderer extends RendererBase implements Renderer {
	private readonly _app: Application;
	private session?: Disposable;
	constructor() {
		super();
		this._app = new Application({
			background: "#1099bb",
			resizeTo: window,
		});
		document.body.appendChild(this._app.view as unknown as Node);
	}
	render(world: World, registry: MenuRegistry): void {
		this.session?.dispose();

		const uiListener = registry.onRegistered((e) => {
			e.focus();
			console.log(`selector: ${JSON.stringify(e.items)}`);
			document.addEventListener("keydown", (_e) => {
				if (_e.key === "b") {
					e.select("bunny");
					console.log("bunny selected");
					return;
				}
				if (_e.key === "t") {
					e.select("tree");
					console.log("tree selected");
					return;
				}
				if (_e.key === "l") {
					e.select("tree-source");
					console.log("tree-source selected");
					return;
				}
				if (_e.key === "a") {
					e.select("animal-source");
					console.log("animal-source selected");
					return;
				}
				if (_e.key === "f") {
					e.select("FOOD");
					console.log("FOOD selected");
					return;
				}
			});
		});

		const tracker = new Map<SceneObject, DisplayObject>();

		const viewport = new Viewport({
			screenWidth: window.innerWidth,
			screenHeight: window.innerHeight,
			worldWidth: world.size.x,
			worldHeight: world.size.y,
			events: this._app.renderer.events,
		});
		this._app.stage.addChild(viewport as DisplayObject);
		viewport.drag().pinch().wheel().decelerate();

		viewport.addListener("clicked", (e) => {
			this._onClick.dispatch({ position: e.world });
		});

		world.scene.onMount(({ obj }) => {
			if (!obj.renderable.kind) throw new Error("Object kind is undefined");
			const sprite = Sprite.from(kindToSprite[obj.renderable.kind]);
			sprite.anchor.set(0.5);
			viewport.addChild(sprite as DisplayObject);
			tracker.set(obj, sprite as DisplayObject);
		});
		world.scene.onDismount(({ obj }) => {
			const sprite = tracker.get(obj);
			if (!sprite) throw new Error("Missing object");
			viewport.removeChild(sprite);
			tracker.delete(obj);
		});

		const renderFrame = () => {
			for (const [{ renderable }, dObj] of tracker.entries()) {
				if (renderable.position) {
					dObj.x = renderable.position.x;
					dObj.y = renderable.position.y;
					dObj.rotation = renderable.rotation;
				}
				if (renderable.state) {
					if (renderable.state === "dead") dObj.rotation = 0;
				}
			}
		};

		this._app.ticker.add(renderFrame);

		this.session = {
			dispose: () => {
				this._app.ticker.remove(renderFrame);
				this._app.stage.removeChild(viewport as DisplayObject);
				uiListener.dispose();
			},
		};
	}
}

// const basicText = new PIXI.Text()
// basicText.x = 50
// basicText.y = 100
// app.stage.addChild(basicText)

// toPixiDisplayObject()
