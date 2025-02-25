import React, { ChangeEvent } from 'react';
import { Group, GroupFilterItem, GroupItem, TreeViewItem } from './GroupFilter';
import groupTypes, { GroupType } from './groupType';

function isGroup(item: boolean | GroupItem): item is GroupItem {
  return (item as GroupItem)?.group !== undefined;
}

export const isChecked = (
  groupValue: string,
  itemValue: string | number,
  id: string | undefined,
  tagValue: string | undefined,
  stateSelected: Record<string, Record<string, boolean | GroupItem>>,
  propSelected: Record<string, Record<string, boolean | GroupItem>>
) => {
  const selected = {
    ...propSelected,
    ...stateSelected,
  };

  if (typeof selected[groupValue] === 'undefined') {
    return false;
  }

  if (isGroup(selected[groupValue][itemValue])) {
    const group = selected[groupValue][itemValue] as GroupItem;
    if (group.isSelected) {
      if (group?.item?.id) {
        return id === group?.item?.id;
      } else if (group?.item?.tagValue) {
        return tagValue === group?.item?.tagValue;
      }
    }

    return Boolean(group.isSelected);
  }

  return Boolean(selected[groupValue][itemValue]);
};

export type FilterMenuItemOnChange = (
  event: React.FormEvent | React.MouseEventHandler,
  selected: unknown,
  selectedItem: {
    value: string;
    label: string | Node;
    id: string;
    type: unknown;
    items: GroupFilterItem[];
  },
  item: {
    id?: string;
    value?: string;
  },
  value: string,
  itemValue: string
) => void;

export const getMenuItems = (
  items: GroupFilterItem[],
  onChange: FilterMenuItemOnChange | undefined,
  calculateSelected: (
    type?: GroupType,
    groupKey?: string,
    value?: TreeViewItem | string,
    checked?: boolean
  ) => Record<string, Record<string, boolean | GroupItem>>,
  groupType?: GroupType,
  groupValue = '',
  groupLabel?: string,
  groupId?: string,
  group?: Group
) => {
  const result =
    items?.map((item: GroupFilterItem, index: number) => ({
      ...item,
      className: `${item?.className || 'pf-u-pl-sm'}`,
      key: item.id || item.value || index,
      value: String(item.value || item.id || index),
      onClick: (event: React.FormEvent | React.MouseEventHandler, treeViewItem?: TreeViewItem, checked?: boolean) => {
        const params: [
          React.FormEvent | React.MouseEventHandler,
          unknown,
          {
            value: string;
            label: string | Node;
            id: string;
            type: unknown;
            items: GroupFilterItem[];
          },
          {
            id?: string;
            value?: string;
          },
          string,
          string
        ] = [
          event,
          calculateSelected(
            groupType || item.type,
            groupValue,
            (groupType || item.type) === groupTypes.treeView ? treeViewItem : item.value,
            checked
          ),
          {
            value: groupValue,
            label: (groupLabel || item.label) as string,
            id: (groupId || item.id) as string,
            type: groupType || item.type,
            items,
            ...(group || item),
          },
          item,
          groupValue,
          item.value as string,
        ];
        onChange?.(...params);
        item?.onClick?.(event, { ...item, label: typeof item.label === 'string' ? item.label : '' }, undefined, checked);
      },
    })) || [];

  return result.filter(({ noFilter }) => !noFilter);
};

export const convertTreeItem = (item: TreeViewItem): TreeViewItem => {
  item.id = item.id || item.value;
  item.name = item.label || item.name;
  item.value = item.id;
  item.label = item.name || '';

  return item.children
    ? {
        ...item,
        children: item.children.map((child) => convertTreeItem(child)),
      }
    : item;
};

export const getGroupMenuItems = (
  groups: Group[],
  onChange: FilterMenuItemOnChange | undefined,
  calculateSelected: (
    type?: GroupType,
    groupKey?: string,
    value?: TreeViewItem | string,
    checked?: boolean
  ) => Record<string, Record<string, boolean | GroupItem>>
) => {
  const result = groups.map((group) => {
    const { value, label, groupSelectable, id, type, items, noFilter } = group;
    const converted = type === groupTypes.treeView ? items.map((item: GroupFilterItem) => convertTreeItem(item as TreeViewItem)) : items;
    return {
      label,
      noFilter,
      value,
      type,
      groupSelectable,
      items: getMenuItems(
        [
          ...(groupSelectable
            ? [
                {
                  value: value || '',
                  label: label || '',
                  id: id || '',
                  type,
                  className: 'pf-u-pl-xs',
                  ...group,
                },
              ]
            : []),
          ...converted,
        ],
        onChange,
        calculateSelected,
        type,
        value,
        label,
        id,
        group
      ),
    };
  });
  return result.filter(({ noFilter, items = [] }) => !noFilter || items.length > 0);
};

export const calculateSelected =
  (selectedTags: Record<string, Record<string, GroupItem | boolean>>) =>
  (type = groupTypes.button, groupKey = '', value: TreeViewItem | string = '', checked = false) => {
    const activeGroup = selectedTags?.[groupKey];
    const children =
      type === groupTypes.treeView
        ? [value as TreeViewItem].reduce(function iter(acc: TreeViewItem[], curr: TreeViewItem): TreeViewItem[] {
            if (Array.isArray(curr?.children)) {
              return curr.children.reduce(iter, acc) || [];
            }

            acc.push(curr);
            return acc;
          }, [])
        : [];

    const itemKeys = type === groupTypes.treeView ? children.map((item: TreeViewItem) => item.id) : [String(value)];

    if (activeGroup) {
      let result = selectedTags;
      itemKeys.map((itemKey = '') => {
        const activeGroup = result[groupKey];
        if (
          type !== groupTypes.radio &&
          (activeGroup[itemKey] instanceof Object ? (activeGroup[itemKey] as GroupItem).isSelected : Boolean(activeGroup[itemKey]))
        ) {
          result = {
            ...result,
            [groupKey]: {
              ...(activeGroup || {}),
              [itemKey]: type === groupTypes.treeView && checked,
            },
          };
        } else {
          result = {
            ...result,
            [groupKey]: {
              ...(type !== groupTypes.radio ? activeGroup || {} : {}),
              [itemKey]: true,
            },
          };
        }
      });
      return result;
    }

    return itemKeys.reduce(
      (acc, curr) => ({
        ...acc,
        [groupKey]: {
          ...acc?.[groupKey],
          [curr || '']: true,
        },
      }),
      selectedTags
    );
  };

const areAllChildrenChecked = (
  dataItem: TreeViewItem,
  groupKey: string,
  stateSelected: Record<string, Record<string, boolean | GroupItem>>,
  selected: Record<string, Record<string, boolean | GroupItem>>
): boolean =>
  dataItem.children
    ? dataItem.children.every((child: TreeViewItem) => areAllChildrenChecked(child, groupKey, stateSelected, selected))
    : isChecked(groupKey, dataItem.id || '', undefined, undefined, stateSelected, selected);

const areSomeChildrenChecked = (
  dataItem: TreeViewItem,
  groupKey: string,
  stateSelected: Record<string, Record<string, boolean | GroupItem>>,
  selected: Record<string, Record<string, boolean | GroupItem>>
): boolean =>
  dataItem.children
    ? dataItem.children.some((child: TreeViewItem) => areSomeChildrenChecked(child, groupKey, stateSelected, selected))
    : isChecked(groupKey, dataItem.id || '', undefined, undefined, stateSelected, selected);

export const mapTree = (
  item: TreeViewItem,
  groupKey: string,
  stateSelected: Record<string, Record<string, boolean | GroupItem>>,
  selected: Record<string, Record<string, boolean | GroupItem>>
): TreeViewItem => {
  const hasCheck = areAllChildrenChecked(item, groupKey, stateSelected, selected);
  item.checkProps = { checked: false };

  if (hasCheck) {
    item.checkProps.checked = true;
  } else {
    const hasPartialCheck = areSomeChildrenChecked(item, groupKey, stateSelected, selected);
    if (hasPartialCheck) {
      item.checkProps = { checked: null };
    }
  }

  if (item.children) {
    return {
      ...item,
      children: item.children.map((child: TreeViewItem) => mapTree(child, groupKey, stateSelected, selected)),
    };
  }

  return item;
};

export const onTreeCheck = (e: ChangeEvent, treeViewItem: TreeViewItem, tree: TreeViewItem[]) =>
  tree[0].onClick?.(e, treeViewItem, undefined, (e?.target as HTMLInputElement)?.checked);
