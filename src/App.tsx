import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { createEffect, createSignal, onCleanup, onMount, Show } from 'solid-js'
import './App.css'
import sound from './assets/react-sounds/success_bling.mp3'

const audio = new Audio(sound)
audio.preload = 'auto'
async function playSound() {
	audio.currentTime = 0
	await audio.play()
}

function Timer(props: { duration: number; onFinish?: () => void }) {
	const [timeLeft, setTimeLeft] = createSignal(props.duration)

	// props.durationが変わった時だけtimeLeftをリセット
	createEffect(() => {
		setTimeLeft(props.duration)
	})

	onMount(() => {
		const interval = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev > 0) {
					return prev - 1
				} else {
					return 0
				}
			})
		}, 1000)
		onCleanup(() => {
			clearInterval(interval)
		})
	})

	createEffect(() => {
		if (timeLeft() === 0) {
			setTimeout(() => {
				props.onFinish?.()
			}, 1000)
		}
	})

	return (
		<div
			style={{
				display: 'flex',
				'flex-direction': 'column',
				'align-items': 'center',
			}}
		>
			<svg width={120} height={120}>
				<title>Rest Timer</title>
				<desc>Time left: {timeLeft()} seconds</desc>
				<circle
					cx={60}
					cy={60}
					r={50}
					stroke="#eee"
					stroke-width={10}
					fill="none"
				/>
				<circle
					cx={60}
					cy={60}
					r={50}
					stroke="#00bcd4"
					stroke-width={10}
					fill="none"
					stroke-dasharray={String(2 * Math.PI * 50)}
					stroke-dashoffset={
						((props.duration - timeLeft()) / props.duration) * 2 * Math.PI * 50
						// ↓開始位置を上(12時方向)にする
						// SVGのstrokeは右(3時方向)が開始なので、回転
					}
					style={{
						transition: 'stroke-dashoffset 1s linear',
						transform: 'rotate(-90deg)',
						'transform-origin': '60px 60px',
					}}
				/>
				<text
					x={60}
					y={68}
					text-anchor="middle"
					font-size="2em"
					fill="#333"
					font-family="sans-serif"
				>
					{timeLeft()}
				</text>
			</svg>
		</div>
	)
}

type Mode = 'hide' | 'rest'
function App() {
	const [getMode, setMode] = createSignal<Mode>('hide')

	onMount(() => {
		const unlisten = listen('start_resting', () => {
			setMode('rest')
		})
    invoke('finish_resting') // minimize the window
		onCleanup(() => {
			unlisten.then((f) => f())
		})
	})

	async function finishResting() {
		setMode('hide')
		await playSound()
		await invoke('finish_resting') // minimize the window
	}

	return (
		<div class="grid place-items-center h-dvh">
			<div class="flex gap-6 items-center">
				<div class="flex flex-col gap-3 items-center">
					<div class="text-3xl">Save your eyes</div>
					<div class="i-tabler-eye-heart w-10 h-10" />
					<div class="text-slate-400">Look 20 feet away for 20 seconds</div>
				</div>
				<div class="w-px h-30 bg-slate-200" />
				<Show when={getMode() === 'rest'}>
					<Timer duration={20} onFinish={() => finishResting()} />
				</Show>
			</div>
		</div>
	)
}

export default App
