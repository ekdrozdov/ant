import { Viewport } from "pixi-viewport";
import { Application, Assets, type Renderable, Sprite } from "pixi.js";
import type { SceneObjectBase } from "../../game/scene/scene";
import type { World } from "../../game/world";
import type { MenuRegistry } from "../../ui/menu";
import type { Disposable } from "../../utils/lifecycle";
import { type Renderer, RendererBase } from "../renderer";
import type { AppScreen } from "./ui/AppScreen";
import { GameScreen } from "./ui/GameScreen";

const kindToAssetUrl = {
	mark: "http://localhost:5173/assets/mark.png",
	bunny: "http://localhost:5173/assets/bunny.png",
	tree: "http://localhost:5173/assets/tree.png",
	"animal-source": "http://localhost:5173/assets/animal-source.png",
	"tree-source": "http://localhost:5173/assets/tree-source.png",
} as const;

const app = new Application();

class Ui {
	private currentScreen?: AppScreen;

	private lastW = 0;
	private lastH = 0;

	public async showScreen(screen: AppScreen) {
		// Remove prev screen.
		const prevScreen = this.currentScreen;
		if (prevScreen) {
			await prevScreen.hide();

			app.ticker.remove(prevScreen.onUpdate, prevScreen);

			if (prevScreen.parent) {
				prevScreen.parent.removeChild(prevScreen);
			}
			prevScreen.destroy();
		}
		await screen.init()
		app.stage.addChild(screen);
		screen.resize(this.lastW, this.lastH);
		app.ticker.add(screen.onUpdate, screen);
		await screen.show();

		this.currentScreen = screen;
	}

	public resize(w: number, h: number) {
		this.lastW = w;
		this.lastH = h;
		this.currentScreen?.resize?.(w, h);
	}
}

const ui = new Ui();

function resize() {
	const windowWidth = window.innerWidth;
	const windowHeight = window.innerHeight;

	// Update canvas style dimensions and scroll window up to avoid issues on mobile resize
	app.renderer.canvas.style.width = `${windowWidth}px`;
	app.renderer.canvas.style.height = `${windowHeight}px`;
	window.scrollTo(0, 0);

	app.renderer.resize(windowWidth, windowHeight);
	ui.resize(windowWidth, windowHeight);
}

export class PixiRenderer extends RendererBase implements Renderer {
	private session?: Disposable;
	private initialized = false;

	async init(): Promise<void> {
		await app.init({
			resolution: Math.max(window.devicePixelRatio, 2),
			background: "#1099bb",
		});

		const canvas = document.getElementById("canvas");
		if (!canvas) {
			throw new Error("Missin canvas");
		}
		canvas.appendChild(app.canvas);

		window.addEventListener("resize", resize);
		resize();

		this.initialized = true;
	}

	watchAndRender(world: World, registry: MenuRegistry): void {
		if (!this.initialized) {
			throw new Error("Renderer is not initialized");
		}
		this.session?.dispose();

		const gameScreen = new GameScreen();
		ui.showScreen(gameScreen);

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

		const tracker = new Map<SceneObjectBase, Renderable>();

		const viewport = new Viewport({
			screenWidth: window.innerWidth,
			screenHeight: window.innerHeight,
			worldWidth: world.size.x,
			worldHeight: world.size.y,
			events: app.renderer.events,
		});
		gameScreen.addChild(viewport);
		viewport.drag().pinch().wheel().decelerate();

		viewport.addListener("clicked", (e) => {
			this._onClick.dispatch({ position: e.world });
		});
		const center = { x: world.size.x / 2, y: world.size.y / 2 };
		viewport.fit(true, center.x, center.y);
		viewport.moveCenter(center.x, center.y);

		world.scene.onMount(async ({ obj }) => {
			if (!obj.renderable.kind) throw new Error("Object kind is undefined");
			const sprite = Sprite.from(
				await Assets.load({ src: kindToAssetUrl[obj.renderable.kind] }),
			);
			sprite.anchor.set(0.5);
			viewport.addChild(sprite);
			tracker.set(obj, sprite);
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

		app.ticker.add(renderFrame);

		this.session = {
			dispose: () => {
				app.ticker.remove(renderFrame);
				app.stage.removeChild(viewport);
				uiListener.dispose();
			},
		};
	}
}
