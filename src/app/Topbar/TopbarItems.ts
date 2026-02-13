import {ITopbarIconButton, ITopbarText, ITopbarTextButton} from './ITopbarItem';
import {TopbarItemType} from './TopbarItemType';

export const AccountButton: ITopbarIconButton = {
  type: TopbarItemType.BUTTON_ICON,
  iconPath: "account_circle",
  altText: "Account",
  action: () => {
    console.log("account-circle was clicked")
  }
}

export const FavoritButton: ITopbarIconButton = {
  type: TopbarItemType.BUTTON_ICON,
  iconPath: "heart",
  altText: "fav",
  action: () => {
    console.log("favorit-button was clicked")
  }
}

export const WarenkorbButton: ITopbarIconButton = {
  type: TopbarItemType.BUTTON_ICON,
  iconPath: "warenkorb",
  altText: "warenkorb",
  action: () => {
    console.log("warenkorb-button was clicked")
  }
}

export const TestText: ITopbarText = {
  type: TopbarItemType.TEXT,
  displayText: "Test Text"
}

export const TestTextButton: ITopbarTextButton = {
  type: TopbarItemType.BUTTON_TEXT,
  displayText: "Test Button",
  action: () => {
    console.log("Test-Text-Button was clicked")
  }
}
