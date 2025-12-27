import { SDK_LIST } from '$lib/domains/logs/domain/sdk-config';
import { getSDKGuides, getInternalGuides } from './documentation.data';

const SDK_QUERY_PARAM = 'sdk';

function sdkNameToSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findSDKIndexBySlug(slug: string): number {
  const normalizedSlug = slug.toLowerCase();
  const index = SDK_LIST.findIndex(
    (sdk) => sdkNameToSlug(sdk.name) === normalizedSlug,
  );
  return index >= 0 ? index : 0;
}

class DocumentationState {
  private _selectedSDKIndex = $state(0);
  private _mobileMenuOpen = $state(false);
  private _activeSection = $state('introduction');
  private _visibleSections = $state<Map<string, number>>(new Map());

  get selectedSDKIndex(): number {
    return this._selectedSDKIndex;
  }

  get selectedSDK() {
    return SDK_LIST[this._selectedSDKIndex];
  }

  get selectedSDKSlug(): string {
    return sdkNameToSlug(this.selectedSDK.name);
  }

  get mobileMenuOpen(): boolean {
    return this._mobileMenuOpen;
  }

  get activeSection(): string {
    return this._activeSection;
  }

  get sdkGuides() {
    return getSDKGuides(this.selectedSDK.name);
  }

  get internalGuides() {
    return getInternalGuides(this.selectedSDK.name);
  }

  public syncFromUrl(url: URL): void {
    const sdkParam = url.searchParams.get(SDK_QUERY_PARAM);
    if (sdkParam) {
      this._selectedSDKIndex = findSDKIndexBySlug(sdkParam);
    }
  }

  public buildUrlWithSDK(baseUrl: URL, sdkIndex: number): string {
    const newUrl = new URL(baseUrl);
    const sdk = SDK_LIST[sdkIndex];
    newUrl.searchParams.set(SDK_QUERY_PARAM, sdkNameToSlug(sdk.name));
    return `${newUrl.pathname}${newUrl.search}`;
  }

  public selectSDK(index: number): void {
    this._selectedSDKIndex = index;
  }

  public toggleMobileMenu(): void {
    this._mobileMenuOpen = !this._mobileMenuOpen;
  }

  public closeMobileMenu(): void {
    this._mobileMenuOpen = false;
  }

  public updateSectionVisibility(
    id: string,
    isIntersecting: boolean,
    ratio: number,
  ): void {
    this._visibleSections.set(id, isIntersecting ? ratio * 100 : 0);
    this._activeSection = this.computeMostVisibleSection();
  }

  private computeMostVisibleSection(): string {
    let highestScore = 0;
    let mostVisible = 'introduction';

    for (const [sectionId, score] of this._visibleSections.entries()) {
      if (score > highestScore) {
        highestScore = score;
        mostVisible = sectionId;
      }
    }

    return mostVisible;
  }
}

export const documentationState = new DocumentationState();
