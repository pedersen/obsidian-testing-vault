import {randomChoice, randomDateInRange, randomInt, randomSubset} from "./random";
import {loremIpsum} from "lorem-ipsum";

let wrap = require('word-wrap');

export interface INoteGenerator {
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

function newFrontMatter({
							publishPercent = 50,
							aliasPercent = 10,
							title = '',
							minTags = 0,
							maxTags = 5
						}: INoteGenerator): string {
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

export function newTitle(titleWords: number): string {
	return loremIpsum({count: titleWords, units: "words"}).toLowerCase().split(' ').map((word) => {
		return word[0].toUpperCase() + word.substring(1)
	}).join(' ');
}

export function newLoremNote({
								 title = '',
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
								 alltitles = [],
								 minLinks = 1,
								 maxLinks = 10
							 }: INoteGenerator): { note: string, title: string } {
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
		for (let i = 0; i < linkedTitles.length; i++) {
			let paragraphNumber = randomInt(0, paragraphs.length);
			paragraphs[paragraphNumber] = `${paragraphs[paragraphNumber]}[[${linkedTitles[i]}]]`
		}
		text = paragraphs.join('\n');
	}
	const wrapped = wrap(text, {width: 75, trim: true, indent: ''});
	const frontmatter = Math.random() <= frontMatterPercent / 100.0 ? newFrontMatter({
		publishPercent: publishPercent,
		aliasPercent: aliasPercent,
		title: title,
		minTags: minTags,
		maxTags: maxTags
	}) : '';
	return {"title": title, "note": frontmatter + wrapped};
}
