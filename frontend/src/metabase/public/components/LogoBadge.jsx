/* @flow */

import React from "react";
import LogoIcon from "metabase/components/LogoIcon";

import cx from "classnames";

type Props = {
    dark: bool,
}

const LogoBadge = ({ dark }: Props) =>
        <span className="text-small">
            <span className="ml1 text-grey-3"></span>
        </span>

export default LogoBadge;
