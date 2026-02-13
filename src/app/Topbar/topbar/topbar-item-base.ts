import {Component, Directive, Input} from '@angular/core';
import {ITopbarItem} from '../ITopbarItem';

@Directive()
export abstract class TopbarItemBase<T extends ITopbarItem> {
  @Input() item!: T;
}
