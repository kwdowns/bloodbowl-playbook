interface GetLeagueResponse {
    id: number;
    name: string;
    Inscriptions: Array<{
        id: number;
        rosterId: number;
        roster: {
            teamColor: string;
            teamName: string;
            teamRace: string;
            id: number;
            imageFile: string;
            tier: number;
        }
        player: TourplayPlayer
    }>
}

export interface GetTeamResponse {
    id: number;
    teamColor: string;
    teamName: string;
    teamRace: string;
    imageFile: string;
    apothecary: boolean;
    assistantCoaches: number;
    cheerLeaders: number;
    fanFactor: number;
    necromancer: boolean;
    rerolls: number;
    teamValue: number;
    treasury: number;
    inducementsValue: number;
    isRedrafting: boolean;
    hasMatchesPlayed: boolean;
    hasMatchesInProgress: boolean;
    player: TourplayPlayer;
    lineUps: Array<LineUp>;
    rosterMaster: TourplayRosterMaster;
    lastMatches: Array<{
        round: number;
        roundName: string;
        scores: Array<{
            casualtiesLocal: number;
            casualtiesVisitor: number;
            concedeLocal: boolean;
            concedeVisitor: boolean;
            hasIncidence: boolean;
            finishInstant: string;
            scoreLocal: number;
            scoreVisitor: number;
            hasNoPointsInClassification: boolean;
        }>,
        groupName: string;
        groupsCount: number;
        phaseSystem: number;
        system: number;
        state: number;
        statePostMatch: number;
        id: number;
        inscriptionLocal: {
            roster:{
                id: number;
                teamName: string;
                teamRace: string;
                imageFile: string;
                teamColor: string;
            },
            player: TourplayPlayer
        },
        inscriptionVisitor: {
            roster:{
                id: number;
                teamName: string;
                teamRace: string;
                imageFile: string;
                teamColor: string;
            },
            player: TourplayPlayer
        },
        tournament: {
            name: string;
        }
    }>;
}

type TourplayPlayer = {
    applicationUserId: string;
    applicationUser: {
        userNameToShow: string;
        pictureFileName: string;
        country?: string;
    }
}

type TourplayRosterMaster = {
    id: number;
    name: string;
    teamRace: string;
    apothecary: boolean;
    necromancer: boolean;
    maxBigGuys: number;
    tier: number;
    prizeReRoll: number;
    teamRosterType: number;
    ruleSet: number;
    lineUpMasters: Array<LineUpMaster>
}
type LineUpMaster = {
    ag: number;
    av: number;
    ma: number;
    pa: number;
    st: number;
    cost: number;
    name: string;
    id: number;
    lineUpMasterId: number;
    position: string;
    state: number;
    skills: Array<TourplaySkill>;
    skillNormal: number;
    skillDouble: number;
    iconClass: string;
    availableRaces: string;
    quantity: number;
}
type TourplaySkill = {
    lineUpMasterId: number;
    skillMasterId: number;
    isRandom: boolean;
    isSecondary: boolean;
    skillMaster: SkillMaster
    skillAttributeMaster?: SkillAttributeMaster
}
type SkillMaster = {
    name: string;
    type: number;
    ruleSet: number;
    id: number;
    skillAttributeMaster?: SkillAttributeMaster
}
type SkillAttributeMaster = {
    type: number;
    id: number;
    value: string;
}
type LineUp = {
    ag: number;
    av: number;
    ma: number;
    pa: number;
    st: number;
    cost: number;
    name: string;
    nigglingInjuries: number;
    number: number;
    pendingImprovements: number;
    level: number;
    sessions: number;
    starPlayerPoints: number;
    isActive: boolean;
    canPlayNextGame: boolean;
    totalCasualties: number;
    totalInjuries: number;
    totalMVPs: number;
    totalPasses: number;
    totalStarPlayerPoints: number;
    totalTouchdowns: number;
    isBigGuy?: boolean;
    id: number;
    lineUpMasterId: number;
    rosterId: number;
    position: string;
    state: number;
    skills: Array<TourplaySkill>,
    lineUpMaster: LineUpMaster
}

const defaultLeagueName = 'kcbbl-season-14';
export async function getTourplayLeagueTeams(leagueName: string = defaultLeagueName): Promise<Array<{rosterId:number, teamName: string, teamRace: string}>>{
  const leagueResponse = await fetch(`https://tourplay.net/tournament/${leagueName.toLowerCase().replace(' ', '-')}`);
  const leagueJson = await leagueResponse.json();
  const leauge = leagueJson as GetLeagueResponse;
  return leauge.Inscriptions.map(x => ({rosterId: x.rosterId, teamName: x.roster.teamName, teamRace: x.roster.teamRace}));
}

export async function getTourplayTeam(rosterId: number): Promise<GetTeamResponse>{
  const teamResponse = await fetch(`https://tourplay.net/roster/${rosterId}`);
  const teamJson = await teamResponse.json();
  return teamJson as GetTeamResponse;
}