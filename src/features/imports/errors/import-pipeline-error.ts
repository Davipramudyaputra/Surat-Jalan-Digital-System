import type {
  ImportIssue,
  ParsedImportDiagnostics,
} from "@/features/imports/types/import-types";

export class ImportPipelineError extends Error {
  readonly code: string;
  readonly diagnostics?: Partial<ParsedImportDiagnostics>;
  readonly issues: ImportIssue[];

  constructor(
    code: string,
    message: string,
    options?: {
      diagnostics?: Partial<ParsedImportDiagnostics>;
      issues?: ImportIssue[];
    },
  ) {
    super(message);
    this.name = "ImportPipelineError";
    this.code = code;
    this.diagnostics = options?.diagnostics;
    this.issues = options?.issues ?? [{ code, message }];
  }
}
