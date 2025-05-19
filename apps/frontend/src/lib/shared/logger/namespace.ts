export class Namespace {
	readonly color: string;
	private static readonly ROOT = 'root';

	constructor(readonly _namespace: string = Namespace.ROOT) {
		this.color = Namespace.randomColor(_namespace);
	}

	toString(): string {
		return `${this._namespace}`;
	}

	child(namespace: string): Namespace {
		return new Namespace(`${this._namespace}:${namespace}`);
	}

	private static randomColor(namespace: string): string {
		let hash = 0;

		for (let i = 0; i < namespace.length; i++) {
			hash = namespace.charCodeAt(i) + ((hash << 5) - hash);
		}

		return colors[Math.abs(hash) % colors.length];
	}
}

// dark colors palette
const colors = [
	'#D32F2F',
	'#D81B60',
	'#AB47BC',
	'#7E57C2',
	'#5C6BC0',
	'#1976D2',
	'#0277BD',
	'#006064',
	'#00796B',
	'#2E7D32',
	'#33691E',
	'#BF360C',
	'#8D6E63',
	'#757575',
	'#546E7A',
];
