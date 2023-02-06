import {App, ButtonComponent, Modal, Notice, SliderComponent, TextComponent, Vault} from "obsidian";
import {INoteGenerator, newLoremNote, newTitle} from "./loremnotes";
import {randomInt} from "./random";

export async function fillVault(maxNotes: number = 1000, notice: Notice, vault: Vault, {
	emptyFilesPercent = 3,
	orphanedNotesPercent = 5,
	leafNotesPercent = 25,
	minTitleWords = 4,
	maxTitleWords = 10,
	minSentenceWords = 5,
	maxSentenceWords = 20,
	minSentences = 4,
	maxSentences = 20,
	minParagraphs = 1,
	maxParagraphs = 10,
	minTags = 0,
	maxTags = 5,
	aliasPercent = 10,
	publishPercent = 50,
	frontMatterPercent = 90,
	minLinks = 1,
	maxLinks = 10
}: INoteGenerator) {
	let titles = Array.apply(null, Array(maxNotes)).map(function () {
	});
	await notice.setMessage("Generating titles");
	for (let i = 0; i < maxNotes; i++) {
		let titleWords = randomInt(minTitleWords, maxTitleWords);
		titles[i] = newTitle(titleWords);
	}

	await notice.setMessage("Generating Empty Notes");
	let generated = 0;
	const emptyFilesCount = Math.floor(maxNotes * (emptyFilesPercent / 100.0));
	for (let i = 0; i < emptyFilesCount; i++) {
		await vault.create(`${titles[generated]}.md`, '');
		generated++;
	}

	await notice.setMessage("Generating Orphaned Notes");
	const orphanedNotesCount = Math.floor(maxNotes * (orphanedNotesPercent / 100.0));
	for (let i = 0; i < orphanedNotesCount; i++) {
		if ((i >= 1) && (i % 20 == 0)) {
			await notice.setMessage(`Progress: Created ${i}/${maxNotes} notes so far`);
		}
		let note = newLoremNote({
			title: titles[generated],
			minTitleWords: minLinks, maxTitleWords: maxTitleWords, minSentenceWords: minSentenceWords,
			maxSentenceWords: maxSentenceWords, minSentences: minSentences, maxSentences: maxSentences,
			minParagraphs: minParagraphs, maxParagraphs: maxParagraphs, minTags: minTags, maxTags: maxTags,
			aliasPercent: aliasPercent, publishPercent: publishPercent, frontMatterPercent: frontMatterPercent,
			minLinks: minLinks, maxLinks: maxLinks
		});
		await vault.create(`${note.title}.md`, note.note);
		generated++;
	}

	await notice.setMessage("Generating Leaf Notes");
	const linksBegin = generated;
	const leafCount = Math.floor(maxNotes * (leafNotesPercent / 100.0));
	for (let i = 0; i < leafCount; i++) {
		if ((i >= 1) && (i % 20 == 0)) {
			await notice.setMessage(`Progress: Created ${i}/${maxNotes} notes so far`);
		}
		let note = newLoremNote({
			title: titles[generated], alltitles: titles.slice(linksBegin),
			minTitleWords: minLinks, maxTitleWords: maxTitleWords, minSentenceWords: minSentenceWords,
			maxSentenceWords: maxSentenceWords, minSentences: minSentences, maxSentences: maxSentences,
			minParagraphs: minParagraphs, maxParagraphs: maxParagraphs, minTags: minTags, maxTags: maxTags,
			aliasPercent: aliasPercent, publishPercent: publishPercent, frontMatterPercent: frontMatterPercent,
			minLinks: minLinks, maxLinks: maxLinks
		});
		await vault.create(`${note.title}.md`, note.note);
		generated++;
	}

	for (let i = generated; i < maxNotes; i++) {
		if ((i >= 1) && (i % 20 == 0)) {
			await notice.setMessage(`Progress: Created ${i}/${maxNotes} notes so far`);
		}
		let note = newLoremNote({
			title: titles[i], alltitles: titles.slice(linksBegin),
			minTitleWords: minLinks, maxTitleWords: maxTitleWords, minSentenceWords: minSentenceWords,
			maxSentenceWords: maxSentenceWords, minSentences: minSentences, maxSentences: maxSentences,
			minParagraphs: minParagraphs, maxParagraphs: maxParagraphs, minTags: minTags, maxTags: maxTags,
			aliasPercent: aliasPercent, publishPercent: publishPercent, frontMatterPercent: frontMatterPercent,
			minLinks: minLinks, maxLinks: maxLinks
		});
		await vault.create(`${note.title}.md`, note.note);
	}
	await notice.setMessage(`Vault generated ${maxNotes} notes`);
	setTimeout(() => notice.hide(), 4000);
}

export class TestingVaultModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	createSlider(title: string, min: number, max: number, step: number, defaultVal: number, parentEl: HTMLElement): SliderComponent {
		const div = parentEl.createDiv();
		const sliderSpan = div.createSpan({text: title})
		const slider = new SliderComponent(sliderSpan);
		const percent = new TextComponent(sliderSpan);
		slider.setLimits(min, max, step);
		slider.setValue(defaultVal);
		percent.setValue(defaultVal.toString());
		slider.onChange((value: number) => {
			percent.setValue(value.toString())
		});
		percent.onChange((value: string) => {
			const svalue = parseInt(value);
			if (!isNaN(svalue)) {
				slider.setValue(parseInt(value));
			} else {
				slider.setValue(defaultVal);
			}
		})
		return slider;
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.empty();
		const notesDiv = contentEl.createDiv();
		const notes = this.createSlider('Number of Notes', 50, 50000, 50, 1000, notesDiv);
		const distributions = contentEl.createDiv();
		distributions.createEl('h1', {text: 'File Distributions'})
		const empty = this.createSlider('Empty (%)', 0, 100, 1, 3, distributions);
		const orphaned = this.createSlider('Orphaned (%)', 0, 100, 1, 5, distributions);
		const leaf = this.createSlider('Leaf Nodes (%)', 0, 100, 1, 25, distributions);
		const okbutton = new ButtonComponent(contentEl);
		okbutton.setButtonText('Okay');
		okbutton.onClick((evt: MouseEvent) => {
			let task_status = new Notice('Generating new testing vault', 0);
			fillVault(notes.getValue(), task_status, this.app.vault, {
				emptyFilesPercent: empty.getValue(),
				orphanedNotesPercent: orphaned.getValue(),
				leafNotesPercent: leaf.getValue()
			});
			this.close();
		})
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
