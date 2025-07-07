export enum AnimationDirection {
	LEFT = 'left',
	RIGHT = 'right',
	FRONT = 'front',
	BACK = 'back',
}

class AnimatedViewState {
	private _nextAnimationDirection: AnimationDirection = $state(
		AnimationDirection.FRONT,
	);

	get nextAnimationDirection() {
		return this._nextAnimationDirection;
	}

	set nextAnimationDirection(value: AnimationDirection) {
		this._nextAnimationDirection = value;
	}
}

export const animatedViewState = new AnimatedViewState();
