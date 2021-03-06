// @flow
import React, { Component } from 'react';
import type { Node } from 'react';
import SVGInline from 'react-svg-inline';
import { Button } from 'react-polymorph/lib/components/Button';
import { ButtonSkin } from 'react-polymorph/lib/skins/simple/ButtonSkin';
import { Link } from 'react-polymorph/lib/components/Link';
import { LinkSkin } from 'react-polymorph/lib/skins/simple/LinkSkin';
import klarityIcon from '../../../assets/images/klarity-logo-loading-grey.inline.svg';
import styles from './Splash.scss';

type Props = {
  onButtonClick: Function,
  onLinkClick: Function,
  title: string,
  subTitle1: string,
  subTitle2?: string,
  description: Node,
  buttonLabel: string,
  linkLabel: boolean | string,
  backgroundImage?: string,
};

export default class SplashNetwork extends Component<Props> {
  render() {
    const {
      onButtonClick,
      onLinkClick,
      title,
      subTitle1,
      subTitle2,
      description,
      buttonLabel,
      linkLabel,
      backgroundImage,
    } = this.props;

    return (
      <div className={styles.component}>
        <div className={styles.backgroundContainer}>
          {backgroundImage && (
            <>
              <div className={styles.backgroundOverlay} />
              <SVGInline
                svg={backgroundImage}
                className={styles.backgroundImage}
              />
            </>
          )}
        </div>
        <div className={styles.content}>
          <SVGInline svg={klarityIcon} className={styles.klarityIcon} />
          <div className={styles.title}>{title}</div>
          <div className={styles.subTitle1}>{subTitle1}</div>
          {subTitle2 && <div className={styles.subTitle2}>{subTitle2}</div>}
          <div className={styles.description}>{description}</div>
          <div className={styles.action}>
            <Button
              className={styles.actionButton}
              label={buttonLabel}
              onClick={onButtonClick}
              skin={ButtonSkin}
            />
          </div>
          {linkLabel && (
            <Link
              className={styles.learnMoreLink}
              onClick={onLinkClick}
              label={linkLabel}
              skin={LinkSkin}
            />
          )}
        </div>
      </div>
    );
  }
}
