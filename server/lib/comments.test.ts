import { describe, it, expect } from 'vitest';
import { stripHtmlTags, calculateCommentScore } from './comments';
import type { HNComment } from './hn-api';

describe('stripHtmlTags', () => {
  describe('basic HTML tag removal', () => {
    it('removes simple HTML tags', () => {
      expect(stripHtmlTags('<p>Hello world</p>')).toBe('Hello world');
    });

    it('removes nested HTML tags', () => {
      expect(stripHtmlTags('<div><span>nested</span></div>')).toBe('nested');
    });

    it('removes self-closing tags', () => {
      expect(stripHtmlTags('before<img src="x"/>after')).toBe('beforeafter');
    });

    it('removes tags with attributes', () => {
      expect(stripHtmlTags('<a href="http://example.com">link</a>')).toBe('link');
    });

    it('handles empty string', () => {
      expect(stripHtmlTags('')).toBe('');
    });

    it('handles string with no tags', () => {
      expect(stripHtmlTags('plain text')).toBe('plain text');
    });
  });

  describe('newline conversion', () => {
    it('converts <br> to newline', () => {
      expect(stripHtmlTags('line1<br>line2')).toBe('line1\nline2');
    });

    it('converts <br/> to newline', () => {
      expect(stripHtmlTags('line1<br/>line2')).toBe('line1\nline2');
    });

    it('converts <br /> to newline', () => {
      expect(stripHtmlTags('line1<br />line2')).toBe('line1\nline2');
    });

    it('converts <BR> to newline (case insensitive)', () => {
      expect(stripHtmlTags('line1<BR>line2')).toBe('line1\nline2');
    });

    it('converts </p> to newline', () => {
      expect(stripHtmlTags('<p>para1</p><p>para2</p>')).toBe('para1\npara2');
    });

    it('converts </P> to newline (case insensitive)', () => {
      expect(stripHtmlTags('<P>para1</P><P>para2</P>')).toBe('para1\npara2');
    });
  });

  describe('HTML entity decoding', () => {
    it('decodes &lt; to <', () => {
      expect(stripHtmlTags('a &lt; b')).toBe('a < b');
    });

    it('decodes &gt; to >', () => {
      expect(stripHtmlTags('a &gt; b')).toBe('a > b');
    });

    it('decodes &amp; to &', () => {
      expect(stripHtmlTags('a &amp; b')).toBe('a & b');
    });

    it('decodes &quot; to "', () => {
      expect(stripHtmlTags('&quot;quoted&quot;')).toBe('"quoted"');
    });

    it('decodes &#x27; to apostrophe', () => {
      expect(stripHtmlTags('it&#x27;s')).toBe("it's");
    });

    it('decodes &#39; to apostrophe', () => {
      expect(stripHtmlTags('it&#39;s')).toBe("it's");
    });

    it('decodes &apos; to apostrophe', () => {
      expect(stripHtmlTags('it&apos;s')).toBe("it's");
    });

    it('decodes &#x2F; to /', () => {
      expect(stripHtmlTags('a&#x2F;b')).toBe('a/b');
    });

    it('decodes &nbsp; to space', () => {
      expect(stripHtmlTags('a&nbsp;b')).toBe('a b');
    });

    it('decodes multiple entities in one string', () => {
      expect(stripHtmlTags('&lt;tag&gt; &amp; &quot;value&quot;')).toBe('<tag> & "value"');
    });
  });

  describe('newline normalization', () => {
    it('collapses 3+ newlines to 2', () => {
      expect(stripHtmlTags('a\n\n\nb')).toBe('a\n\nb');
    });

    it('collapses many newlines to 2', () => {
      expect(stripHtmlTags('a\n\n\n\n\n\nb')).toBe('a\n\nb');
    });

    it('preserves exactly 2 newlines', () => {
      expect(stripHtmlTags('a\n\nb')).toBe('a\n\nb');
    });

    it('preserves single newlines', () => {
      expect(stripHtmlTags('a\nb')).toBe('a\nb');
    });

    it('trims leading and trailing whitespace', () => {
      expect(stripHtmlTags('  text  ')).toBe('text');
    });
  });

  describe('complex cases', () => {
    it('handles typical HN comment HTML', () => {
      const html = '<p>First paragraph.</p><p>Second paragraph with <i>italic</i> text.</p>';
      expect(stripHtmlTags(html)).toBe('First paragraph.\nSecond paragraph with italic text.');
    });

    it('handles code snippets with entities', () => {
      const html = 'Use <code>&lt;div&gt;</code> for containers';
      expect(stripHtmlTags(html)).toBe('Use <div> for containers');
    });

    it('handles links with quotes', () => {
      const html = 'Check <a href="http://example.com">this &quot;article&quot;</a>';
      expect(stripHtmlTags(html)).toBe('Check this "article"');
    });

    it('handles multiple br tags creating multiple newlines', () => {
      const html = 'line1<br><br><br><br>line2';
      expect(stripHtmlTags(html)).toBe('line1\n\nline2');
    });
  });
});

describe('calculateCommentScore', () => {
  // Helper to create a minimal HNComment for testing
  function createComment(overrides: Partial<HNComment> = {}): HNComment {
    return {
      id: 1,
      time: Date.now(),
      parent: 0,
      type: 'comment',
      ...overrides,
    };
  }

  describe('length scoring', () => {
    describe('optimal length (50-500 chars)', () => {
      it('scores +100 for 50 chars', () => {
        const comment = createComment();
        expect(calculateCommentScore(comment, 50)).toBe(100);
      });

      it('scores +100 for 500 chars', () => {
        const comment = createComment();
        expect(calculateCommentScore(comment, 500)).toBe(100);
      });

      it('scores +100 for middle of range (275 chars)', () => {
        const comment = createComment();
        expect(calculateCommentScore(comment, 275)).toBe(150); // 100 + 50 for sweet spot
      });
    });

    describe('sweet spot bonus (150-300 chars)', () => {
      it('scores +150 for 150 chars (100 base + 50 bonus)', () => {
        const comment = createComment();
        expect(calculateCommentScore(comment, 150)).toBe(150);
      });

      it('scores +150 for 300 chars (100 base + 50 bonus)', () => {
        const comment = createComment();
        expect(calculateCommentScore(comment, 300)).toBe(150);
      });

      it('scores +150 for 200 chars (100 base + 50 bonus)', () => {
        const comment = createComment();
        expect(calculateCommentScore(comment, 200)).toBe(150);
      });

      it('does not give bonus for 149 chars (just outside sweet spot)', () => {
        const comment = createComment();
        expect(calculateCommentScore(comment, 149)).toBe(100);
      });

      it('does not give bonus for 301 chars (just outside sweet spot)', () => {
        const comment = createComment();
        expect(calculateCommentScore(comment, 301)).toBe(100);
      });
    });

    describe('too short (<50 chars)', () => {
      it('scores -50 for 0 chars', () => {
        const comment = createComment();
        expect(calculateCommentScore(comment, 0)).toBe(-50);
      });

      it('scores -50 for 49 chars', () => {
        const comment = createComment();
        expect(calculateCommentScore(comment, 49)).toBe(-50);
      });

      it('scores -50 for 1 char', () => {
        const comment = createComment();
        expect(calculateCommentScore(comment, 1)).toBe(-50);
      });
    });

    describe('too long (>500 chars)', () => {
      it('scores +50 for 501 chars (base 50, no additional penalty yet)', () => {
        const comment = createComment();
        expect(calculateCommentScore(comment, 501)).toBe(50);
      });

      it('scores +40 for 600 chars (base 50, -10 for first 100 over)', () => {
        const comment = createComment();
        expect(calculateCommentScore(comment, 600)).toBe(40);
      });

      it('scores +30 for 700 chars (base 50, -20 for 200 over)', () => {
        const comment = createComment();
        expect(calculateCommentScore(comment, 700)).toBe(30);
      });

      it('scores +20 for 800 chars (base 50, -30 for 300 over)', () => {
        const comment = createComment();
        expect(calculateCommentScore(comment, 800)).toBe(20);
      });

      it('scores +10 for 900 chars (base 50, -40 for 400 over)', () => {
        const comment = createComment();
        expect(calculateCommentScore(comment, 900)).toBe(10);
      });

      it('scores 0 for 1000 chars (base 50, -50 capped penalty)', () => {
        const comment = createComment();
        expect(calculateCommentScore(comment, 1000)).toBe(0);
      });

      it('penalty caps at -50 for very long comments (2000 chars)', () => {
        const comment = createComment();
        expect(calculateCommentScore(comment, 2000)).toBe(0); // 50 - 50 cap
      });

      it('penalty caps at -50 for extremely long comments (5000 chars)', () => {
        const comment = createComment();
        expect(calculateCommentScore(comment, 5000)).toBe(0); // 50 - 50 cap
      });
    });
  });

  describe('reply bonus (kids)', () => {
    it('scores +10 for 1 reply', () => {
      const comment = createComment({ kids: [2] });
      expect(calculateCommentScore(comment, 49)).toBe(-50 + 10); // -40
    });

    it('scores +20 for 2 replies', () => {
      const comment = createComment({ kids: [2, 3] });
      expect(calculateCommentScore(comment, 49)).toBe(-50 + 20); // -30
    });

    it('scores +30 for 3 replies (at cap)', () => {
      const comment = createComment({ kids: [2, 3, 4] });
      expect(calculateCommentScore(comment, 49)).toBe(-50 + 30); // -20
    });

    it('caps at +30 for 4 replies', () => {
      const comment = createComment({ kids: [2, 3, 4, 5] });
      expect(calculateCommentScore(comment, 49)).toBe(-50 + 30); // -20
    });

    it('caps at +30 for many replies (10)', () => {
      const comment = createComment({ kids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11] });
      expect(calculateCommentScore(comment, 49)).toBe(-50 + 30); // -20
    });

    it('scores 0 bonus for empty kids array', () => {
      const comment = createComment({ kids: [] });
      expect(calculateCommentScore(comment, 50)).toBe(100); // just the length bonus
    });

    it('scores 0 bonus for undefined kids', () => {
      const comment = createComment(); // no kids property
      expect(calculateCommentScore(comment, 50)).toBe(100);
    });
  });

  describe('combined scoring', () => {
    it('combines optimal length with replies', () => {
      const comment = createComment({ kids: [2, 3] });
      // 150 chars = 100 + 50 (sweet spot) + 20 (2 replies) = 170
      expect(calculateCommentScore(comment, 150)).toBe(170);
    });

    it('combines sweet spot length with max replies', () => {
      const comment = createComment({ kids: [2, 3, 4, 5, 6] });
      // 200 chars = 100 + 50 (sweet spot) + 30 (capped replies) = 180
      expect(calculateCommentScore(comment, 200)).toBe(180);
    });

    it('combines short penalty with replies', () => {
      const comment = createComment({ kids: [2] });
      // 30 chars = -50 (short) + 10 (1 reply) = -40
      expect(calculateCommentScore(comment, 30)).toBe(-40);
    });

    it('combines long penalty with replies', () => {
      const comment = createComment({ kids: [2, 3, 4] });
      // 1000 chars = 50 - 50 (long penalty capped) + 30 (3 replies) = 30
      expect(calculateCommentScore(comment, 1000)).toBe(30);
    });

    it('calculates maximum possible score', () => {
      const comment = createComment({ kids: [2, 3, 4, 5, 6, 7] });
      // Sweet spot (200 chars) = 100 + 50 = 150, plus max replies = 30, total = 180
      expect(calculateCommentScore(comment, 200)).toBe(180);
    });

    it('calculates minimum possible score', () => {
      const comment = createComment(); // no kids
      // Very short = -50, no replies = 0, total = -50
      expect(calculateCommentScore(comment, 0)).toBe(-50);
    });
  });

  describe('boundary conditions', () => {
    it('boundary at 49/50 chars', () => {
      const comment = createComment();
      expect(calculateCommentScore(comment, 49)).toBe(-50); // too short
      expect(calculateCommentScore(comment, 50)).toBe(100); // optimal
    });

    it('boundary at 149/150 chars (sweet spot start)', () => {
      const comment = createComment();
      expect(calculateCommentScore(comment, 149)).toBe(100); // optimal, no bonus
      expect(calculateCommentScore(comment, 150)).toBe(150); // optimal + sweet spot
    });

    it('boundary at 300/301 chars (sweet spot end)', () => {
      const comment = createComment();
      expect(calculateCommentScore(comment, 300)).toBe(150); // optimal + sweet spot
      expect(calculateCommentScore(comment, 301)).toBe(100); // optimal, no bonus
    });

    it('boundary at 500/501 chars', () => {
      const comment = createComment();
      expect(calculateCommentScore(comment, 500)).toBe(100); // optimal
      expect(calculateCommentScore(comment, 501)).toBe(50);  // too long, base score
    });
  });
});
