import {TopbarItemType} from './TopbarItemType';

export type ITopbarItem = ITopbarText | ITopbarTextButton | ITopbarIconButton;

export interface ITopbarText {
  type: TopbarItemType.TEXT;
  displayText: string;
}

export interface ITopbarButton {
  action: () => void;
}

export interface ITopbarIconButton extends ITopbarButton{
  type: TopbarItemType.BUTTON_ICON;
  iconPath: string;
  altText: string;
}

export interface ITopbarTextButton extends ITopbarButton {
  type: TopbarItemType.BUTTON_TEXT;
  displayText: string;
}
