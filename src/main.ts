import {Plugin} from 'obsidian';
import {newLoremNote} from "./loremnotes";
import {TestingVaultModal} from "./vault";

/*
	* From comment on Discord:
	  You might also want to consider adding other rando text generations, other than lorem ipsum, such as
	  https://www.npmjs.com/package/txtgen That way, you can have some actual English text to benchmark,
	  which might be interesting for linguistic-related plugins
 */

export default class TestingVaultPlugin extends Plugin {
	async deleteVaultContents() {
		this.app.vault.getFiles().map(async (fname) => {
			await this.app.vault.delete(fname, true)
		});
	}

	async onload() {
		// Create a single randomized note of lorem ipsum.
		this.addCommand({
			id: 'single-note',
			name: 'Make a single randomized note in your vault',
			callback: () => {
				let note = newLoremNote({});
				this.app.vault.create(`${note.title}.md`, note.note);
			}
		});

		this.addCommand({
			id: 'fill-vault',
			name: 'Make a group of randomized notes in your vault',
			callback: () => {
				new TestingVaultModal(this.app).open();
			}
		});
		this.addCommand({
			id: 'destroy-vault',
			name: 'Destroy everything in this vault',
			callback: () => {
				this.deleteVaultContents();
			}
		})
	}

	onunload() {

	}
}

