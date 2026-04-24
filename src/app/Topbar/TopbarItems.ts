import {ITopbarIconButton, ITopbarText, ITopbarTextButton} from './ITopbarItem';
import {TopbarItemType} from './TopbarItemType';

export const AccountButton: ITopbarIconButton = {
  type: TopbarItemType.BUTTON_ICON,
  iconPath: "account_circle",
  altText: "Account",
  action: () => {}
}

export const FavoritButton: ITopbarIconButton = {
  type: TopbarItemType.BUTTON_ICON,
  iconPath: "heart",
  altText: "fav",
  action: () => {}
}

export const WarenkorbButton: ITopbarIconButton = {
  type: TopbarItemType.BUTTON_ICON,
  iconPath: "warenkorb",
  altText: "warenkorb",
  action: () => {}
}

export const TestText: ITopbarText = {
  type: TopbarItemType.TEXT,
  displayText: "Test Text"
}

export const TestTextButton: ITopbarTextButton = {
  type: TopbarItemType.BUTTON_TEXT,
  displayText: "Test Button",
  action: () => {}
}
