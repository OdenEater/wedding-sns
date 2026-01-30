import { formatMessage, useMessages } from '@/hooks/useMessages';

describe('useMessages', () => {
    it('returns messages object', () => {
        const messages = useMessages();
        expect(messages).toBeDefined();
        // Assuming 'common' key exists based on app/page.tsx usage
        // If it fails I will adjust, but assuming keys from useMessages usage
    });
});

describe('formatMessage', () => {
    it('replaces placeholders with provided values', () => {
        const template = 'Hello, {name}!';
        const params = { name: 'World' };
        expect(formatMessage(template, params)).toBe('Hello, World!');
    });

    it('handles multiple placeholders', () => {
        const template = '{greeting}, {name}!';
        const params = { greeting: 'Hi', name: 'User' };
        expect(formatMessage(template, params)).toBe('Hi, User!');
    });

    it('ignores placeholders without matching params', () => {
        const template = 'Hello, {name}!';
        const params = {};
        expect(formatMessage(template, params)).toBe('Hello, {name}!');
    });
});
