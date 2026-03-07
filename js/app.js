import { MarkdownParser } from './md.js';
import { GFX } from './gfx.js';

class Router {
	static getPost() {
		const params = new URLSearchParams(location.search);
		return params.get('post');
	}

	static go(post) {
		history.pushState(null, '', '?post=' + post);
	}
}

class Menu {
	constructor(app) {
		this.app = app;

		this.el = document.getElementById('menu');
		this.list = document.getElementById('page-list');

		this.search = document.getElementById('search');

		this.search.addEventListener('input', () => this.render());

		document.getElementById('list-view').onclick = () => {
			this.list.className = 'list';
		};

		document.getElementById('grid-view').onclick = () => {
			this.list.className = 'grid';
		};
	}

	toggle() {
		const visible = this.el.classList.toggle('visible');

		if (visible) {
			this.search.value = '';
			this.render();
			this.search.focus();
		}
	}
	render() {
		const q = this.search.value.toLowerCase();

		this.list.innerHTML = '';

		for (const p of this.app.posts) {
			if (q && !p.title.toLowerCase().includes(q)) continue;

			const div = document.createElement('div');

			div.className = 'page';
			div.innerText = p.title;

			div.onclick = () => {
				this.toggle();
				this.app.open(p.file);
			};

			this.list.appendChild(div);
		}
	}
}

class BlogApp {
	constructor() {
		this.content = document.getElementById('content');

		this.init();
	}

	async init() {
		new GFX();

		await this.loadIndex();

		this.menu = new Menu(this);

		document.getElementById('menu-btn').onclick = () => {
			this.menu.toggle();
		};

		document.addEventListener('keydown', e => {
			if (e.ctrlKey && e.key === 'k') {
				e.preventDefault();
				this.menu.toggle();
			}
		});

		window.onpopstate = () => this.route();

		this.route();
	}

	async loadIndex() {
		const res = await fetch('etc/index.json');
		this.posts = await res.json();
	}

	async route() {
		const post = Router.getPost() || 'home.md';

		this.open(post);
	}

	async open(file) {
		Router.go(file);

		this.content.classList.remove('show');

		const html = await MarkdownParser.load('md/' + file);

		this.content.innerHTML = html;

		requestAnimationFrame(() => {
			this.content.classList.add('show');
		});
	}
}

window.addEventListener('DOMContentLoaded', () => {
	new BlogApp();
});
