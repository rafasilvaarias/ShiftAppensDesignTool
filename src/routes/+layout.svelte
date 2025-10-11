<script>
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}

<style>
	:global(html *) {
		font-family: sans-serif;
		color: #F2F2F1;
		background-color: #202020;
	}

	:global(button) {
		background-color: #404040;
		border: 1px solid #F2F2F1;
	}

	:global(button, input) {
		min-width: 5em;
		min-height: 2em;
		padding: 1em;
		border-radius: 0.5em;
	}
</style>
