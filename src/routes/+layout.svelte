<script>
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}

<style>
	:global(html) {
		--black1: #1B1B1B;
		--black2: #232323;
		--white3: #535353;
		--white2: #959595;
		--white1: #F2F2F1;
		--blue: #4555CF;
		--pink: #BA58A7;
	}
	:global(html *) {
		font-family: sans-serif;
		color: var(--white1);
		background-color: var(--black1);
		font-size: 1em;
	}

	:global(body) {
		margin:0;
	}

	:global(button) {
		background-color: var(--black1);
		border: 1px solid var(--white3);
		width: 100%;
		border-radius: 1em;
		display: flex;
		justify-content: center;
		align-items: center;
		gap:0.5em;
	}

	:global(button:hover) {
		background-color: var(--black2);
		transition: background-color 0.2s;
		cursor: pointer;
	}

	:global(button:disabled) {
		color: var(--white3);
		border: 1px dashed var(--white3);
	}

	:global(button:disabled:hover) {
		background-color: var(--black1);
		cursor: not-allowed;
		transition: none;
	}

	:global(.selected) { 
		border-color: var(--white1);
	}

	:global(input[type="checkbox"]) {
		min-width: 1em;
		min-height: 1em;
		accent-color: var(--blue);
		border: 1px solid var(--white3);
	}

	:global(button, input, select) {
		min-width: 5em;
		padding: 0.8em;
	}

	:global(input, select) {
		border-radius: 0.5em;
		border: 1px solid var(--white2);
	}

	:global(.hidden) {
		display: none;
	}
</style>
