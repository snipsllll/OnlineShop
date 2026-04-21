import { getTestBed } from '@angular/core/testing';
import { ɵresolveComponentResources as resolveComponentResources } from '@angular/core';
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from '@angular/platform-browser/testing';

getTestBed().initTestEnvironment(
  BrowserTestingModule,
  platformBrowserTesting(),
);

// Resolve Angular component templateUrl/styleUrl references before tests run
beforeAll(async () => {
  await resolveComponentResources((_url: string) =>
    Promise.resolve({ text: () => Promise.resolve('') } as unknown as Response)
  );
});
