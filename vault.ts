import {Notice, Vault} from "obsidian";
import {INoteGenerator, newLoremNote, newTitle} from "./loremnotes";
import {randomInt} from "./random";

export async function fillVault(maxNotes: number = 100, notice: Notice, vault: Vault, {
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
