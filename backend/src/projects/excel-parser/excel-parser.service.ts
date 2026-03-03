import { Injectable } from '@nestjs/common';

/**
 * ExcelParserService — kept as a stub.
 * Excel import is no longer supported; all data comes from the Jira API.
 * Use POST /projects/:id/import/jira instead.
 */
@Injectable()
export class ExcelParserService {
    importExcel(_projectId: string, _file: Buffer, _filename: string): never {
        throw new Error(
            'Excel import is disabled. Use the Jira API import endpoint instead: POST /projects/:id/import/jira',
        );
    }
}
