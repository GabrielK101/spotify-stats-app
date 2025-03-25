import React from "react";
import GraphCard from '../GraphCard/GraphCard.jsx';
import InfoCard from '../InfoCard/InfoCard.jsx';
import AristGraph from '../ArtistGraph/ArtistGraph.jsx';
import '../Styles/Dashboard.css';

function Dashboard({ userId, user }){
    return (
        <>
            <div className="info-container">
                <InfoCard userId={userId} title={"Today's Stats"} dataType={"minutes"} />
                <InfoCard userId={userId} title={"Top Songs"} dataType={"songs"} />
                <InfoCard userId={userId} title={"Top Artists"} dataType={"artists"} />
            </div>
            <GraphCard title="Weekly Listening" userId={userId} dataType="weekly" pointImage={user && user.profile_pic_url} />
            <AristGraph userId={userId} />
        </>
    );
}

export default Dashboard;