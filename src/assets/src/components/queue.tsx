import * as React from "react";
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

import { User, AttendingQueue } from "../models";
import { ErrorDisplay, LoadingDisplay, DisabledMessage } from "./common";
import { getQueue as apiGetQueueAttending, addMeeting as apiAddMeeting, removeMeeting as apiRemoveMeeting } from "../services/api";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import { usePromise } from "../hooks/usePromise";
import { redirectToLogin } from "../utils";

interface QueueAttendingProps {
    queue: AttendingQueue;
    user: User;
    joinQueue: () => void;
    leaveQueue: () => void;
    disabled: boolean;
}

function QueueAttendingNotJoined(props: QueueAttendingProps) {
    return (
        <>
        <div className="row">
            <ul className="col-lg">
                <li>Number of people currently in line: <strong>{props.queue.line_length}</strong></li>
                <li>You are not in the meeting queue yet</li>
            </ul>
        </div>
        <div className="row">
            <div className="col-lg">
                <button disabled={props.disabled} onClick={() => props.joinQueue()} type="button" className="btn btn-primary">
                    Join the line
                    {props.disabled && DisabledMessage}
                </button>
            </div>
        </div>
        </>
    );
}

const TurnNowAlert = () =>
    <div className="alert alert-success" role="alert">
        <strong>It's your turn!</strong> If you haven't already joined the meeting, follow the directions on the right to join it now!
    </div>

const TurnSoonAlert = () =>
    <div className="alert alert-warning" role="alert">
        <strong>Your turn is coming up!</strong> Follow the directions on the right to join the meeting now so you are ready when it's your turn.
    </div>

function QueueAttendingJoined(props: QueueAttendingProps) {
    const alert = props.queue.my_meeting!.line_place === 0
        ? <TurnNowAlert/>
        : props.queue.my_meeting!.line_place && props.queue.my_meeting!.line_place <= 5
            ? <TurnSoonAlert/>
            : undefined;
    return (
        <>
        <div className="row">
            <div className="col-lg">
                {alert}
                <ul>
                    <li>You are in line and there are <strong>{props.queue.my_meeting!.line_place} people</strong> in line ahead of you</li>
                    <li>The host will join the BlueJeans meeting when it is your turn</li>
                    <li>We'll show a message in this window when your turn is coming up--keep an eye on the window so you don't miss it!</li>
                </ul>
            </div>
            <div className="col-sm">
                <div className="card">
                    <div className="card-body">
                        <h5 className="card-title">Join the BlueJeans Meeting</h5>
                        <p className="card-text">Join now so you can make sure you are set up and ready. Download the app and test your audio before it is your turn.</p>
                        <p className="card-text">Having problems with video? As a back-up, you can call 1.312.216.0325 from the USA (or 1.416.900.2956 from Canada) from any phone and enter BLUEJEANS_NUMBER_HERE#. You are not a moderator, so you do not need a moderator passcode.</p>
                        <a href="BLUEJEANS_NUMBER_HERE" target="_blank" className="card-link">Join the meeting</a>
                        <a href="https://its.umich.edu/communication/videoconferencing/blue-jeans/getting-started" target="_blank" className="card-link">How to use BlueJeans at U-M</a>
                    </div>
                </div>
            </div>
        </div>
        <div className="row">
            <div className="col-lg">
                <button disabled={props.disabled} onClick={() => props.leaveQueue()} type="button" className="btn btn-warning">
                    Leave the line
                    {props.disabled && DisabledMessage}
                </button>
            </div>
        </div>
        </>
    );
}

function QueueAttending(props: QueueAttendingProps) {
    const content = !props.queue.my_meeting
        ? <QueueAttendingNotJoined {...props}/>
        : <QueueAttendingJoined {...props}/>
    const yourQueueAlert = props.queue.hosts.find(h => h.username === props.user.username)
        && (
            <>
            <br/>
            <p className="alert alert-info col-lg">
                This is your queue, you can <Link to={"/manage/" + props.queue.id}>manage it</Link>.
            </p>
            </>
        );
    const footer = (
        <a target="_blank" href="https://documentation.its.umich.edu/node/1833">
            Learn more about using Remote Office Hours Queue as an attendee
        </a>
    );
    return (
        <>
        <h2>Welcome to the {props.queue.name} meeting queue.</h2>
        {content}
        {yourQueueAlert}
        <hr/>
        {footer}
        </>
    );
}

interface QueuePageProps {
    user?: User;
}

export function QueuePage(props: QueuePageProps) {
    if (!props.user) {
        redirectToLogin()
    }
    const { queue_id } = useParams();
    if (queue_id === undefined) throw new Error("queue_id is undefined!");
    if (!props.user) throw new Error("user is undefined!");
    const queueIdParsed = parseInt(queue_id);
    const [queue, setQueue] = useState(undefined as AttendingQueue | undefined);
    const refresh = () => apiGetQueueAttending(queueIdParsed);
    const [doRefresh, refreshLoading, refreshError] = usePromise(refresh, setQueue);
    useEffect(() => {
        doRefresh();
    }, []);
    const [interactions] = useAutoRefresh(doRefresh);
    const joinQueue = async () =>  {
        interactions.next(false);
        await apiAddMeeting(queueIdParsed, props.user!.id);
        await doRefresh();
    }
    const [doJoinQueue, joinQueueLoading, joinQueueError] = usePromise(joinQueue);
    const leaveQueue = async () => {
        interactions.next(false);
        await apiRemoveMeeting(queue!.my_meeting!.id);
        await doRefresh();
    }
    const [doLeaveQueue, leaveQueueLoading, leaveQueueError] = usePromise(leaveQueue);
    const isChanging = joinQueueLoading || leaveQueueLoading;
    const isLoading = refreshLoading || isChanging;
    const loadingDisplay = <LoadingDisplay loading={isLoading}/>
    const errorDisplay = <ErrorDisplay error={refreshError || joinQueueError || leaveQueueError}/>
    const queueDisplay = queue
        && <QueueAttending queue={queue} user={props.user} disabled={isChanging} joinQueue={doJoinQueue} leaveQueue={doLeaveQueue}/>
    return (
        <div className="container-fluid content">
            {loadingDisplay}
            {errorDisplay}
            {queueDisplay}
        </div>
    );
}
