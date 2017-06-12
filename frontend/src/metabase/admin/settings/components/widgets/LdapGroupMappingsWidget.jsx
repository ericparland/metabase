// @flow

import React, { Component } from "react";

import { ModalFooter } from "metabase/components/ModalContent"
import AdminContentTable from "metabase/components/AdminContentTable";
import Button from "metabase/components/Button";
import GroupSelect from "metabase/admin/people/components/GroupSelect";
import GroupSummary from "metabase/admin/people/components/GroupSummary";
import Icon from "metabase/components/Icon";
import LoadingSpinner from "metabase/components/LoadingSpinner";
import Modal from "metabase/components/Modal";
import PopoverWithTrigger from "metabase/components/PopoverWithTrigger";

import { PermissionsApi, SettingsApi } from "metabase/services";

import _ from "underscore";

import SettingToggle from './SettingToggle';

type Props = {
    setting: any,
    updateSetting: (value: any) => void,
    mappings: { [string]: number[] },
    updateMappings: (value: { [string]: number[] }) => void
};

type State = {
    showEditModal: boolean,
    showAddRow: boolean,
    groups: Object[],
    mappings: { [string]: number[] }
};

export default class LdapGroupMappingsWidget extends Component<*, Props, State> {
    props: Props;
    state: State;

    constructor(props, context) {
        super(props, context);
        this.state = {
            showEditModal: false,
            showAddRow: false,
            groups: [],
            mappings: {}
        };
    }

    _showEditModal = (e) => {
        e.preventDefault();
        this.setState({ mappings: this.props.mappings || {}, showEditModal: true });
        PermissionsApi.groups().then((groups) => this.setState({ groups }));
    }

    _showAddRow = (e) => {
        e.preventDefault();
        this.setState({ showAddRow: true });
    }

    _hideAddRow = (e) => {
        this.setState({ showAddRow: false });
    }

    _addMapping = (dn) => {
        this.setState((prevState: State) => ({ mappings: { ...prevState.mappings, [dn]: [] }, showAddRow: false }));
    }

    _changeMapping = (dn: string) => (group, selected) => {
        if (selected) {
            this.setState((prevState: State) => ({
                mappings: {
                    ...prevState.mappings,
                    [dn]: [...prevState.mappings[dn], group.id]
                }
            }));
        } else {
            this.setState((prevState: State) => ({
                mappings: {
                    ...prevState.mappings,
                    [dn]: prevState.mappings[dn].filter(id => id !== group.id)
                }
            }));
        }
    }

    _deleteMapping = (dn: string) => (e) => {
        e.preventDefault();
        this.setState((prevState: State) => ({ mappings: _.omit(prevState.mappings, dn) }));
    }

    _cancelClick = (e) => {
        e.preventDefault();
        this.setState({ showEditModal: false, showAddRow: false });
    }

    _saveClick = (e) => {
        e.preventDefault();
        const { state: { mappings }, props: { updateMappings } } = this;
        SettingsApi.put({ key: "ldap-group-mappings", value: mappings }).then(() => {
            updateMappings && updateMappings(mappings);
            this.setState({ showEditModal: false, showAddRow: false });
        });
    }

    render() {
        const { showEditModal, showAddRow, groups, mappings } = this.state;

        return (
            <div className="flex align-center">
                <SettingToggle {...this.props} />
                <div className="flex align-center pt1">
                    <Button type="button" className="ml1" medium onClick={this._showEditModal}>Edit Mappings</Button>
                </div>
                { showEditModal ? (
                    <Modal wide>
                        <div>
                            <div className="pt4 px4">
                                <h2>Group Mappings</h2>
                            </div>
                            <div className="px4">
                                <Button className="float-right" primary onClick={this._showAddRow}>Create a mapping</Button>
                                <p className="text-measure">
                                    Mappings allow Metabase to automatically add and remove users from groups based on the membership information provided by the
                                    directory server. Membership to the Admin group can be granted through mappings, but will not be automatically removed as a
                                    failsafe measure.
                                </p>
                                <AdminContentTable columnTitles={['Distinguished Name', 'Groups', '']}>
                                    { showAddRow ? (
                                        <AddMappingRow mappings={mappings} onCancel={this._hideAddRow} onAdd={this._addMapping} />
                                    ) : null }
                                    { Object.entries(mappings).map(([dn, ids]) =>
                                        <MappingRow
                                            key={dn}
                                            dn={dn}
                                            groups={groups}
                                            selectedGroups={ids}
                                            onChange={this._changeMapping(dn)}
                                            onDelete={this._deleteMapping(dn)}
                                        />
                                    ) }
                                </AdminContentTable>
                            </div>
                            <ModalFooter>
                                <Button type="button" onClick={this._cancelClick}>Cancel</Button>
                                <Button primary onClick={this._saveClick}>Save</Button>
                            </ModalFooter>
                        </div>
                    </Modal>
                ) : null }
            </div>
        );
    }
}

class AddMappingRow extends Component {
    constructor(props, context) {
        super(props, context);
        this.state = {
            value: ''
        };
    }

    _handleCancelClick = (e) => {
        e.preventDefault();
        const { onCancel } = this.props;
        onCancel && onCancel();
        this.setState({ value: '' });
    }

    _handleAddClick = (e) => {
        e.preventDefault();
        const { onAdd } = this.props;
        onAdd && onAdd(this.state.value);
        this.setState({ value: '' });
    }

    render() {
        const { value } = this.state;

        const isValid = value && this.props.mappings[value] === undefined;

        return (
            <tr>
                <td colSpan="3" style={{ padding: 0 }}>
                    <div className="my2 pl1 p1 bordered border-brand rounded relative flex align-center">
                        <input
                            className="input--borderless h3 ml1 flex-full"
                            type="text"
                            value={value}
                            placeholder="cn=People,ou=Groups,dc=metabase,dc=com"
                            autoFocus
                            onChange={(e) => this.setState({ value: e.target.value })}
                        />
                        <span className="link no-decoration cursor-pointer" onClick={this._handleCancelClick}>Cancel</span>
                        <Button className="ml2" primary={!!isValid} disabled={!isValid} onClick={this._handleAddClick}>Add</Button>
                    </div>
                </td>
            </tr>
        );
    }
}

class MappingGroupSelect extends Component {
    render() {
        const { groups, selectedGroups, onGroupChange } = this.props;

        if (!groups || groups.length === 0) {
            return <LoadingSpinner />;
        }

        const selected = selectedGroups.reduce((g, id) => ({ ...g, [id]: true }), {});

        return (
            <PopoverWithTrigger
                ref="popover"
                triggerElement={
                    <div className="flex align-center">
                        <span className="mr1 text-grey-4">
                            <GroupSummary groups={groups} selectedGroups={selected} />
                        </span>
                        <Icon className="text-grey-2" name="chevrondown"  size={10}/>
                    </div>
                }
                triggerClasses="AdminSelectBorderless py1"
                sizeToFit
            >
                <GroupSelect groups={groups} selectedGroups={selected} onGroupChange={onGroupChange} />
            </PopoverWithTrigger>
        );
    }
}

class MappingRow extends Component {
    render() {
        const { dn, groups, selectedGroups, onChange, onDelete } = this.props;

        return (
            <tr>
                <td>{dn}</td>
                <td>
                    <MappingGroupSelect
                        groups={groups}
                        selectedGroups={selectedGroups}
                        onGroupChange={onChange}
                    />
                </td>
                <td className="Table-actions">
                    <Button warning onClick={onDelete}>Remove</Button>
                </td>
            </tr>
        );
    }
}
