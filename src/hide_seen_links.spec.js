import { assert, expect, test } from 'vitest'
import { sortByPriority } from './hide_seen_links.js'
import { Window } from 'happy-dom';

function html(html_text) {
    const window = new Window({ url: 'https://localhost:8080' });
    const document = window.document;
    document.body.innerHTML = html_text;

    return document.querySelector('a');
}

test('sortByPriorityHtml',
    () => expect(sortByPriority([
        html(`<a></a>`),
        html(`<a title="Link" href="http://example.com/download?cat=1">Download</a>`),
        html(`<a title="Link" href="http://example.com/download">Download</a>`),
        html(`<a href="http://example.com/download">Download Now</a>`),
    ])).toEqual([
        html(`<a href="http://example.com/download">Download Now</a>`),
        html(`<a title="Link" href="http://example.com/download">Download</a>`),
        html(`<a title="Link" href="http://example.com/download?cat=1">Download</a>`),
        html(`<a></a>`),
    ])
)
