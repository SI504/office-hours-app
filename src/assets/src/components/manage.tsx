import * as React from "react";
import { useState, useEffect } from "react";
import { getQueuesFake as apiGetQueues, addQueueFake as apiAddQueue, removeQueueFake as apiRemoveQueue } from "../services/api";
import { User, ManageQueue } from "../models";
import { RemoveButton, AddButton, ErrorDisplay, LoadingDisplay } from "./common";
import { Link } from "react-router-dom";
import { pageTaskAsync } from "../utils";

interface QueueListProps {
    queues: ManageQueue[];
    removeQueue: (q: ManageQueue) => void;
    addQueue: () => void;
}

function QueueList(props: QueueListProps) {
    const queues = props.queues.map((q) => 
        <li>
            <Link to={`/manage/${q.id}`}>
                {q.id}: {q.name}
            </Link>
            <RemoveButton remove={() => props.removeQueue(q)}> Delete Queue</RemoveButton>
        </li>
    );
    return (
        <div>
            <ul>{queues}</ul>
            <AddButton add={() => props.addQueue()}> Add Queue</AddButton>
        </div>
    );
}

interface ManagePageProps {
    user?: User;
}

export function ManagePage(props: ManagePageProps) {
    const [queues, setQueues] = useState(undefined as ManageQueue[] | undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(undefined as Error | undefined);
    const refresh = () => {
        pageTaskAsync(
            () => apiGetQueues(),
            setQueues,
            setIsLoading,
            setError,
        );
    }
    useEffect(() => {
        refresh();
    }, []);
    const removeQueue = (q: ManageQueue) => {
        setIsLoading(true);
        apiRemoveQueue(q.id)
            .then((data) => {
                refresh();
            })
            .catch((error: Error) => {
                console.error(error);
                setError(error);
                setIsLoading(false);
            });
    }
    const addQueue = () => {
        const name = prompt("Queue name?", "Queueueueueue");
        if (!name) return;
        setIsLoading(true);
        apiAddQueue(name)
            .then((data) => {
                refresh();
            })
            .catch((error: Error) => {
                console.error(error);
                setError(error);
                setIsLoading(false);
            });
    }
    const loadingDisplay = <LoadingDisplay loading={isLoading}/>
    const errorDisplay = <ErrorDisplay error={error}/>
    const queueList = queues !== undefined
        && <QueueList queues={queues} removeQueue={removeQueue} addQueue={addQueue}/>
    return (
        <div>
            {loadingDisplay}
            {errorDisplay}
            {queueList}
        </div>
    );
}
