import {App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, Vault} from 'obsidian';
import {loremIpsum} from "lorem-ipsum";
import {lineNumbers} from "@codemirror/view";

let wrap = require('word-wrap');

/*
	Defaults for the plugin:
	* Number of notes to make: 1000

	* From comment on Discord:
	  You might also want to consider adding other rando text generations, other than lorem ipsum, such as
	  https://www.npmjs.com/package/txtgen That way, you can have some actual English text to benchmark,
	  which might be interesting for linguistic-related plugins
 */

interface INoteGenerator {
	title?: string; // ''
	minTitleWords?: number; // 4
	maxTitleWords?: number; // 10
	minSentenceWords?: number; // 5
	maxSentenceWords?: number; // 20
	minSentences?: number; // 4
	maxSentences?: number; // 20
	minParagraphs?: number; // 1
	maxParagraphs?: number; // 10
	minTags?: number; // 0
	maxTags?: number; // 5
	aliasPercent?: number; // 10
	publishPercent?: number; // 50
	frontMatterPercent?: number; // 90
	alltitles?: Array<string>; // []
	emptyFilesPercent?: number; // 3
	orphanedNotesPercent?: number; // 5
	leafNotesPercent?: number; // 25
	minLinks?: number; // 1
	maxLinks?: number; // 10
}

const tags = Array.from(new Set(loremIpsum({count: 100, units: "words"})
	.split(' ').map((word) => {
		return `#${word}`
	})))

const cssclasses = Array.from(new Set(loremIpsum({count: 100, units: "words"})
	.split(' ')));

function randomInt(min: number, max: number, power: number = 1): number {
	return Math.floor(Math.pow(Math.random() * (max - min + 1), power)) + min;
}

function randomSubset(arr: Array<any>, size: number): Array<any> {
	let shuffled = arr.slice(0), i = arr.length, temp, index;
	while (i--) {
		index = Math.floor((i + 1) * Math.random());
		temp = shuffled[index];
		shuffled[index] = shuffled[i];
		shuffled[i] = temp;
	}
	return shuffled.slice(0, size);
}

function randomChoice(arr: Array<any>): any {
	return arr[randomInt(0, arr.length - 1)];
}

function randomDateInRange(start: Date, end: Date): Date {
	const range = end.getTime() - start.getTime();
	const newMs = randomInt(0, range);
	return new Date(start.getTime() + newMs);
}

function newFrontMatter({publishPercent=50, aliasPercent=10, title='', minTags=0, maxTags=5}: INoteGenerator): string {
	const cssclass = cssclasses[randomInt(0, cssclasses.length - 1)];
	const publish = Math.random() >= publishPercent / 100.0 ? "true" : " false";
	// generate aliases here
	let alias = '';
	const aliasresult = Math.random();
	if (aliasresult <= aliasPercent / 100.0) {
		alias = title.split(' ').map((word) => {
			return word[0]
		}).join('');
	}
	// generate tags here
	const numTags = randomInt(minTags, maxTags);
	const chosenTags = randomSubset(tags, numTags).join(',')
	const status = randomChoice(["Backlog", "In progress", "Done"]);
	const published = randomChoice([0, 1]);
	const weight = randomInt(1, 100);
	const start = new Date(Date.now());
	const end = new Date(start.getTime() + 31536000000); // magic number, milliseconds in a year
	const duedate = randomDateInRange(start, end);

	return `---\ntags: ${chosenTags}\ncssclass: ${cssclass}\n`
		+ `aliases: ${alias}\npublish: ${publish}\n`
		+ `status: ${status}\npublished: ${published}\n`
		+ `due: ${duedate.toISOString().substring(0, 10)}\n`
		+ `weight: ${weight}\n`
		+ `---\n`;
}

function newTitle(titleWords: number): string {
	return loremIpsum({count: titleWords, units: "words"}).toLowerCase().split(' ').map((word) => {
		return word[0].toUpperCase() + word.substring(1)}).join(' ');
}
function newLoremNote({title = '', minTitleWords = 4, maxTitleWords = 10, minSentenceWords = 5, maxSentenceWords = 20,
					  minSentences = 4, maxSentences = 20, minParagraphs = 1, maxParagraphs = 10, minTags = 0, maxTags = 5,
					  aliasPercent = 10, publishPercent = 50,
					  frontMatterPercent = 90, alltitles=[], minLinks=1, maxLinks=10}: INoteGenerator): { note: string, title: string } {
	const titleWords = randomInt(minTitleWords, maxTitleWords);
	const numParagraphs = randomInt(minParagraphs, maxParagraphs, 4);
	if (title.length == 0) {
		title = newTitle(titleWords);
	}
	let text = loremIpsum({
		count: numParagraphs, units: "paragraphs", format: "plain",
		paragraphLowerBound: minSentences, paragraphUpperBound: maxSentences,
		sentenceLowerBound: minSentenceWords, sentenceUpperBound: maxSentenceWords,
		suffix: "\n\n"
	});
	if (alltitles?.length > 0) {
		const numberofLinks = randomInt(minLinks, maxLinks);
		const linkedTitles = randomSubset(alltitles, numberofLinks);
		let paragraphs = text.split('\n');
		for (let i=0; i<linkedTitles.length; i++) {
			let paragraphNumber = randomInt(0, paragraphs.length);
			paragraphs[paragraphNumber] = `${paragraphs[paragraphNumber]}[[${linkedTitles[i]}]]`
		}
		text = paragraphs.join('\n');
	}
	const wrapped = wrap(text, {width: 75, trim: true, indent: ''});
	const frontmatter = Math.random() <= frontMatterPercent / 100.0 ? newFrontMatter({publishPercent:publishPercent, aliasPercent:aliasPercent, title:title, minTags:minTags, maxTags:maxTags}) : '';
	return {"title": title, "note": frontmatter + wrapped};
}

async function fillVault(maxNotes: number=100, notice: Notice, vault: Vault, {emptyFilesPercent=3,
	orphanedNotesPercent=5, leafNotesPercent=25, minTitleWords=4, maxTitleWords=10,
	minSentenceWords=5, maxSentenceWords=20, minSentences=4, maxSentences=20, minParagraphs=1, maxParagraphs=10,
	minTags=0, maxTags=5, aliasPercent=10, publishPercent=50, frontMatterPercent=90,
	minLinks=1, maxLinks=10}: INoteGenerator) {
	let titles = Array.apply(null, Array(maxNotes)).map(function () {});
	await notice.setMessage("Generating titles");
	for (let i=0; i<maxNotes; i++) {
		let titleWords = randomInt(minTitleWords, maxTitleWords);
		titles[i] = newTitle(titleWords);
	}

	await notice.setMessage("Generating Empty Notes");
	let generated = 0;
	const emptyFilesCount = Math.floor(maxNotes*(emptyFilesPercent/100.0));
	for (let i=0; i<emptyFilesCount; i++) {
		await vault.create(`${titles[generated]}.md`, '');
		generated++;
	}

	await notice.setMessage("Generating Orphaned Notes");
	const orphanedNotesCount = Math.floor(maxNotes*(orphanedNotesPercent/100.0));
	for (let i=0; i<orphanedNotesCount; i++) {
		if ((i>=1) && (i%20==0)) {
			await notice.setMessage(`Progress: Created ${i}/${maxNotes} notes so far`);
		}
		let note = newLoremNote({title: titles[generated],
			minTitleWords: minLinks, maxTitleWords: maxTitleWords, minSentenceWords: minSentenceWords,
			maxSentenceWords: maxSentenceWords, minSentences: minSentences, maxSentences: maxSentences,
			minParagraphs: minParagraphs, maxParagraphs: maxParagraphs, minTags: minTags, maxTags: maxTags,
			aliasPercent: aliasPercent, publishPercent: publishPercent, frontMatterPercent: frontMatterPercent,
			minLinks: minLinks, maxLinks: maxLinks});
		await vault.create(`${note.title}.md`, note.note);
		generated++;
	}

	await notice.setMessage("Generating Leaf Notes");
	const linksBegin = generated;
	const leafCount = Math.floor(maxNotes*(leafNotesPercent/100.0));
	for (let i=0; i<leafCount; i++) {
		if ((i>=1) && (i%20==0)) {
			await notice.setMessage(`Progress: Created ${i}/${maxNotes} notes so far`);
		}
		let note = newLoremNote({title: titles[generated], alltitles: titles.slice(linksBegin),
			minTitleWords: minLinks, maxTitleWords: maxTitleWords, minSentenceWords: minSentenceWords,
			maxSentenceWords: maxSentenceWords, minSentences: minSentences, maxSentences: maxSentences,
			minParagraphs: minParagraphs, maxParagraphs: maxParagraphs, minTags: minTags, maxTags: maxTags,
			aliasPercent: aliasPercent, publishPercent: publishPercent, frontMatterPercent: frontMatterPercent,
			minLinks: minLinks, maxLinks: maxLinks});
		await vault.create(`${note.title}.md`, note.note);
		generated++;
	}

	for (let i=generated; i < maxNotes; i++) {
		if ((i>=1) && (i%20==0)) {
			await notice.setMessage(`Progress: Created ${i}/${maxNotes} notes so far`);
		}
		let note = newLoremNote({title: titles[i], alltitles: titles.slice(linksBegin),
			minTitleWords: minLinks, maxTitleWords: maxTitleWords, minSentenceWords: minSentenceWords,
			maxSentenceWords: maxSentenceWords, minSentences: minSentences, maxSentences: maxSentences,
			minParagraphs: minParagraphs, maxParagraphs: maxParagraphs, minTags: minTags, maxTags: maxTags,
			aliasPercent: aliasPercent, publishPercent: publishPercent, frontMatterPercent: frontMatterPercent,
			minLinks: minLinks, maxLinks: maxLinks});
		await vault.create(`${note.title}.md`, note.note);
	}
	await notice.setMessage(`Vault generated ${maxNotes} notes`);
	setTimeout(() => notice.hide(), 4000);
}

interface TestingVaultPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: TestingVaultPluginSettings = {
	mySetting: 'default'
}

export default class TestingVaultPlugin extends Plugin {
	settings: TestingVaultPluginSettings;

	async deleteVaultContents() {
		this.app.vault.getFiles().map(async (fname) => {
			await this.app.vault.delete(fname, true)
		});
	}

	async onload() {
		await this.loadSettings();

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		// const statusBarItemEl = this.addStatusBarItem();
		/*
				// This creates an icon in the left ribbon.
				const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
					// Called when the user clicks the icon.
					new Notice('This is a notice!');
				});
				// Perform additional things with the ribbon
				ribbonIconEl.addClass('my-plugin-ribbon-class');
		*/


		/*
				// This adds a simple command that can be triggered anywhere
				this.addCommand({
					id: 'open-sample-modal-simple',
					name: 'Open sample modal (simple)',
					callback: () => {
						new SampleModal(this.app).open();
						let note = newLoremNote({});
						this.app.vault.create(`${note.title}.md`, note.note);
					}
				});
		*/
		// Create a single randomized note of lorem ipsum.
		this.addCommand({
			id: 'testing-vault-single-note',
			name: 'Make a single randomized note in your vault',
			callback: () => {
				let note = newLoremNote({});
				this.app.vault.create(`${note.title}.md`, note.note);
			}
		});

		this.addCommand({
			id: 'testing-vault-fill-vault',
			name: 'Make a group of randomized notes in your vault',
			callback: () => {
				const maxnotes=100;
				let task_status = new Notice('Generating new testing vault', 0);
				fillVault(maxnotes, task_status, this.app.vault, {});
			}
		});
		this.addCommand({
			id: 'testing-vault-destroy-vault',
			name: 'Destroy everything in this vault',
			callback: () => {
				this.deleteVaultContents();
			}
		})
		/*
				// This adds an editor command that can perform some operation on the current editor instance
				this.addCommand({
					id: 'sample-editor-command',
					name: 'Sample editor command',
					editorCallback: (editor: Editor, view: MarkdownView) => {
						console.log(editor.getSelection());
						editor.replaceSelection('Sample Editor Command');
					}
				});
		*/
		/*
				// This adds a complex command that can check whether the current state of the app allows execution of the command
				this.addCommand({
					id: 'open-sample-modal-complex',
					name: 'Open sample modal (complex)',
					checkCallback: (checking: boolean) => {
						// Conditions to check
						const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
						if (markdownView) {
							// If checking is true, we're simply "checking" if the command can be run.
							// If checking is false, then we want to actually perform the operation.
							if (!checking) {
								new SampleModal(this.app).open();
							}

							// This command will only show up in Command Palette when the check function returns true
							return true;
						}
					}
				});
		*/

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		/*
				// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
				// Using this function will automatically remove the event listener when this plugin is disabled.
				this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
					console.log('click', evt);
				});

				// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
				this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
		*/
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: TestingVaultPlugin;

	constructor(app: App, plugin: TestingVaultPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
