import * as React from "react";
import { Form } from "react-bootstrap";

import { EnabledBackendName, MeetingBackend } from "../models";


export const getBackendByName = (name: EnabledBackendName, backends: MeetingBackend[]) => {
    return backends.find(b => b.name === name) as MeetingBackend;
}

interface AllowedMeetingBackendsFormProps {
    backends: MeetingBackend[];
    allowed: Set<string>;
    onChange: (allowedBackends: Set<string>) => void;
    disabled: boolean;
}

export function AllowedBackendsForm(props: AllowedMeetingBackendsFormProps) {
    const toggleAllowed = (backend_type: string) => {
        const newAllowed = new Set(props.allowed);
        if (newAllowed.has(backend_type)) {
            newAllowed.delete(backend_type);
        } else {
            newAllowed.add(backend_type);
        }
        props.onChange(newAllowed);
    }
    const allowedMeetingTypeEditors = props.backends
        .map((b) =>
            <Form.Group key={b.name} controlId={b.name}>
                <Form.Check
                    type="checkbox"
                    label={b.friendly_name}
                    checked={props.allowed.has(b.name)}
                    onChange={() => toggleAllowed(b.name)}
                />
            </Form.Group>
        );
    return (
        <Form>
            {allowedMeetingTypeEditors}
        </Form>
    );
}


interface BackendSelectorProps {
    allowedBackends: Set<string>;
    backends: MeetingBackend[];
    selectedBackend: string;
    onChange: (backend: string) => void;
}

export const BackendSelector: React.FC<BackendSelectorProps> = (props) => {  
    const options = Array.from(props.allowedBackends)
        .map(
            a => (
                <option key={a} value={a}>
                    {getBackendByName(a as EnabledBackendName, props.backends).friendly_name}
                </option>
            )
    );
    const handleChange = (event: React.FormEvent<HTMLSelectElement>) => {
        props.onChange(event.currentTarget.value);
    }
    return (
        <select className="btn btn-sm select-dropdown" onChange={handleChange} value={props.selectedBackend}>
            {options}
        </select>
    );
}
