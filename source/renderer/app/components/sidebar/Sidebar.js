// @flow
import React, { Component } from 'react';
import { observer } from 'mobx-react';
import { find } from 'lodash';
import classNames from 'classnames';
import styles from './Sidebar.scss';
import SidebarCategory from './SidebarCategory';
import SidebarCategoryNetworkInfo from './SidebarCategoryNetworkInfo';
import SidebarWalletsMenu from './wallets/SidebarWalletsMenu';
import { CATEGORIES_BY_NAME } from '../../config/sidebarConfig';
import { ROUTES } from '../../routes-config';
import type { networkType } from '../../types/networkTypes';
import type { SidebarCategoryInfo } from '../../config/sidebarConfig';
import type { SidebarWalletType } from '../../types/sidebarTypes';

type Props = {
  menus: SidebarMenus,
  categories: Array<SidebarCategoryInfo>,
  activeSidebarCategory: string,
  isShowingSubMenus: boolean,
  pathname: string,
  network: networkType,
  onActivateCategory: Function,
  onAddWallet: Function,
  isSophieActivated: boolean,
};

export type SidebarMenus = {
  wallets: ?{
    items: Array<SidebarWalletType>,
    activeWalletId: ?string,
    actions: {
      onWalletItemClick: Function,
    },
  },
};

@observer
export default class Sidebar extends Component<Props> {
  static defaultProps = {
    isShowingSubMenus: false,
  };

  render() {
    const {
      menus,
      categories,
      activeSidebarCategory,
      pathname,
      isShowingSubMenus,
      onAddWallet,
      isSophieActivated,
      onActivateCategory,
    } = this.props;

    let subMenu = null;

    const walletsCategory = find(categories, {
      name: CATEGORIES_BY_NAME.WALLETS.name,
    });
    const walletsCategoryRoute = walletsCategory ? walletsCategory.route : null;

    if (
      menus &&
      menus.wallets &&
      menus.wallets.items &&
      activeSidebarCategory === walletsCategoryRoute
    ) {
      subMenu = (
        <SidebarWalletsMenu
          wallets={menus.wallets ? menus.wallets.items : []}
          onAddWallet={onAddWallet}
          onWalletItemClick={
            menus.wallets && menus.wallets.actions
              ? menus.wallets.actions.onWalletItemClick
              : null
          }
          isActiveWallet={(id) =>
            id === (menus.wallets ? menus.wallets.activeWalletId : null)
          }
          isAddWalletButtonActive={pathname === ROUTES.WALLETS.ADD}
          isSophieActivated={isSophieActivated}
          visible={isShowingSubMenus}
        />
      );
    }

    const sidebarStyles = classNames([
      styles.component,
      !isShowingSubMenus || subMenu == null ? styles.minimized : null,
    ]);

    return (
      <div className={sidebarStyles}>
        <div className={styles.minimized}>
          {categories.map((category: SidebarCategoryInfo) => {
            const content = this.getCategoryContent(category.name);
            const isActive = activeSidebarCategory === category.route;
            return (
              <SidebarCategory
                key={category.name}
                category={category}
                isActive={isActive}
                onClick={onActivateCategory}
                content={content}
              />
            );
          })}
        </div>
        {subMenu}
      </div>
    );
  }

  getCategoryContent = (categoryName: string) => {
    if (categoryName === 'NETWORK_INFO') {
      return <SidebarCategoryNetworkInfo network={this.props.network} />;
    }
    return null;
  };
}
