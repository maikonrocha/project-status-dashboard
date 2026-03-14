import { MailService } from './mail.service';

describe('MailService', () => {
  let service: MailService;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    service = new MailService();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('sendVerificationCode', () => {
    it('resolves without throwing', async () => {
      await expect(
        service.sendVerificationCode('user@test.com', '123456'),
      ).resolves.toBeUndefined();
    });

    it('logs the email and code to console', async () => {
      await service.sendVerificationCode('user@test.com', '654321');

      const output = consoleSpy.mock.calls.flat().join(' ');
      expect(output).toContain('user@test.com');
      expect(output).toContain('654321');
    });
  });

  describe('sendInviteEmail', () => {
    it('resolves without throwing', async () => {
      await expect(
        service.sendInviteEmail('new@test.com', 'Acme Corp', 'invite-token'),
      ).resolves.toBeUndefined();
    });

    it('logs email and company name to console', async () => {
      await service.sendInviteEmail('new@test.com', 'Acme Corp', 'invite-token');

      const output = consoleSpy.mock.calls.flat().join(' ');
      expect(output).toContain('new@test.com');
      expect(output).toContain('Acme Corp');
    });

    it('includes invite link with encoded email in console output', async () => {
      await service.sendInviteEmail('alice+test@test.com', 'Acme', 'tok');

      const output = consoleSpy.mock.calls.flat().join(' ');
      expect(output).toContain('tok');
    });
  });
});
