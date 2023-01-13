import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { loremIpsum } from "lorem-ipsum";
import {AnyType} from "@typescript-eslint/type-utils";

let wrap = require('word-wrap');

/*
	Defaults for the plugin:
	* Number of notes to make: 1000
	* Percentage of notes that will be leaf notes: 25%
	* Percentage of notes that will be completely empty (zero bytes): 3%
	* Percentage of orphaned nodes: 5%
	* Min number of links to other notes: 1
	* Max number of links to other notes: 10
		* Skew towards minimum, make the higher number of links harder to happen
 */

const tags = Array.from(new Set(loremIpsum({count: 100, units: "words"})
	.split(' ').map((word) => {return `#${word}`})))

function randomInt(min:int, max:int, power:int=1) : int {
	return Math.floor(Math.pow(Math.random() * (max - min +1), power)) + min;
}

function randomSubset(arr:Array<any>, size:int):Array<any> {
		let shuffled = arr.slice(0), i = arr.length, temp, index;
		while (i--) {
			index = Math.floor((i + 1) * Math.random());
			temp = shuffled[index];
			shuffled[index] = shuffled[i];
			shuffled[i] = temp;
		}
		return shuffled.slice(0, size);
}

function randomChoice(arr:Array<any>) : any {
	return arr[randomInt(0, arr.length-1)];
}

function randomDateInRange(start:Date, end:Date) : Date {
	const range = end.getTime() - start.getTime();
	const newMs = randomInt(0, range);
	return new Date(start.getTime() + newMs);
}

function newLoremNote(minTitleWords:int=4, maxTitleWords:int=10, minSentenceWords:int= 5, maxSentenceWords:int= 20,
	minSentences:int=4, maxSentences:int=20, minParagraphs:int=1, maxParagraphs:int=10, minTags:int=0, maxTags:int=5,
					  minAliases:int=0, maxAliases:int=3, aliasPercent:int=10, publishPercent:int=50,
					  frontMatterPercent:int=90): {note:string, title:string} {
	const titleWords = randomInt(minTitleWords, maxTitleWords);
	const numParagraphs = randomInt(minParagraphs, maxParagraphs, 4);
	const title = loremIpsum({count: titleWords, units: "words"}).toLowerCase().split(' ').map((word) => { return word[0].toUpperCase() + word.substring(1)}).join(' ');
	const text = loremIpsum({count: numParagraphs, units: "paragraphs", format: "plain",
		paragraphLowerBound: minSentences, paragraphUpperBound: maxSentences,
		sentenceLowerBound: minSentenceWords, sentenceUpperBound: maxSentenceWords,
		suffix: "\n\n"
	});
	const wrapped = wrap(text, {width: 75, trim: true, indent: ''});
	let frontmatter = '';
	const frontmatterresult = Math.random();
	if (frontmatterresult <= frontMatterPercent/100.0) {
		try {
			const cssclass = tags[randomInt(0, tags.length-1)].substring(1);
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
			const published = randomChoice([0,1]);
			const weight = randomInt(1, 100);
			const start = new Date(Date.now());
			const end = new Date(start.getTime() + 31536000000); // magic number, milliseconds in a year
			const duedate = randomDateInRange(start, end);

			frontmatter = `---\ntags: ${chosenTags}\ncssclass: ${cssclass}\n`
				+`aliases: ${alias}\npublish: ${publish}\n`
				+`status: ${status}\npublished: ${published}\n`
				+`due: ${duedate.toISOString().substring(0,10)}\n`
				+`weight: ${weight}\n`
				+`---\n`;
		}
		catch (err) {
			// swallowing this since having errors in making frontmatter is acceptable. Empty frontmatter is valid note
			// material, and if errors occur while generating, we're going to be okay with empty.
			console.log(err);
		}
	}
	return {"title": title, "note": frontmatter+ wrapped};
}

interface TestingVaultPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: TestingVaultPluginSettings = {
	mySetting: 'default'
}

export default class TestingVaultPlugin extends Plugin {
	settings: TestingVaultPluginSettings;

	deleteVaultContents() {
		this.app.vault.getFiles().map((fname) => {this.app.vault.delete(fname, true)});
	}

	async onload() {
		await this.loadSettings();

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
				let note = newLoremNote();
				this.app.vault.create(`${note.title}.md`, note.note);
			}
		});

		this.addCommand({
			id: 'testing-vault-fill-vault',
			name: 'Make a group of randomized notes in your vault',
			callback: () => {
				for (let i=0; i<100; i++) {
					let note = newLoremNote();
					this.app.vault.create(`${note.title}.md`, note.note);
				}
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
