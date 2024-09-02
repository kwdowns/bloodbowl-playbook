<template>
  <div>
    <select v-model="selectedOffenseTeam">
      <option v-for="team in selectableOffenseTeams" :key="team.teamName" :value="team.teamName">{{ team.teamName }} - {{ team.teamRace }}</option>
    </select>
    <select v-model="selectedDefenseTeam">
      <option 
        v-for="team in selectableDefenseTeams" 
        :key="team.teamName" 
        :value="team.teamName"
      >
      {{ team.teamName }} - {{ team.teamRace }}
      </option>
    </select>
  </div>
  <div class="w-full">
    <div>
      <p>Add offensive players</p>
      <PlayerCard 
      v-for="p in offensePlayers" 
      :key="p.id" 
      :player="p"
      />
    </div>
    <div>
      <p>Add defensive players</p>
      <PlayerCard v-for="p in defensePlayers" :key="p.id" :player="p" draggable="true" />
    </div>
  </div>
  <div
    class="w-full h-full grid grid-cols-[repeat(15, minmax(0, 1fr))] grid-rows-[repeat(26, minmax(0, 1fr))]"
  >
    <PitchSquare
      v-for="cell in pitchLocations"
      :key="`pitch_${cell.row}_${cell.column}`"
      :row="cell.row"
      :column="cell.column"
      :onPlayerDrop="onDrop"
      :beginHover="() => {}"
      :endHover="() => {}"
      :class="{
        'w-4': true
      }"
      :dodgeModifiers="() => {
        const squareModifiers = dodgeModifiers.filter(m => m.row === cell.row && m.column === cell.column);
        if(squareModifiers && squareModifiers.length > 0)
        {
          return squareModifiers[0];
        }
        return null;
      }"
    >
      <PlayerCard
        v-if="store.getPlayerAtLocation(cell)"
        :player="store.getPlayerAtLocation(cell)!"
      />
    </PitchSquare>
  </div>
</template>

<script setup lang="ts">
import PlayerCard from '@/components/PlayerCard.vue'
import { usePlayerStore, useTeamsStore } from '@/stores/playerStore'
import PitchSquare from './PitchSquare.vue'
import { computed, ref } from 'vue'
import { data } from '@/lib/data'
import type { FieldedPlayer } from '@/lib/models/FieldedPlayer'
import type { PlayerDraggingEvent, PlayerDroppedEvent } from '@/lib/models/PlayerDraggingEvent'
import type { PitchCoordinates } from '@/lib/models/PitchCoordinates'
import { GetTeams } from '@/lib/tourplay/tourplayApi'

const pitchLocations = ref(
  new Array(26 * 15).fill({ row: 0, column: 0 }).map((_, i) => ({
    row: i % 26,
    column: Math.floor(i / 26)
  }))
)

const store = usePlayerStore()
const teamStore = useTeamsStore();

if(teamStore.storeTeams.length === 0)
{
  teamStore.addTeams(await GetTeams());
}

const selectedOffenseTeam = ref<string>('');
const selectedDefenseTeam = ref<string>('');

const selectableOffenseTeams = computed(() => teamStore.storeTeams.filter(t => t.teamName !== selectedDefenseTeam.value));
const selectableDefenseTeams = computed(() => teamStore.storeTeams.filter(t => t.teamName !== selectedOffenseTeam.value));

const offensePlayers = computed(() => store.players.filter(p => p.teamName === selectedOffenseTeam.value));
const defensePlayers = computed(() => store.players.filter(p => p.teamName === selectedDefenseTeam.value));

const blockAssists = computed(getBlockAssists);
const dodgeModifiers = computed(getDodgeModifiers);

const onDrop = (draggedPlayer : PlayerDroppedEvent) => {
 
  if(!draggedPlayer.sourceLocation)
  {
    store.addPlayer({...draggedPlayer.player, ...draggedPlayer.targetLocation});
  }
  else
  {
    store.movePlayer({ playerId: draggedPlayer.player.id, ...draggedPlayer.targetLocation});
  }
}

function getAdjacentCoordinates(location: PitchCoordinates): PitchCoordinates[] {
  const adjacentLocations: PitchCoordinates[] = [];
  for(let row = location.row - 1; row <= location.row + 1; row++)
  {
    for(let column = location.column - 1; column <= location.column + 1; column++)
    {
      if(row === location.row && column === location.column)
      {
        continue;
      }
      if(row < 0 || row >= 26 || column < 0 || column >= 15)
      {
        continue;
      }
      adjacentLocations.push({row, column});
    }
  }
  return adjacentLocations;
}

function getAdjacentPlayers(location: PitchCoordinates): FieldedPlayer[] {
  const adjacentLocations = getAdjacentCoordinates(location);
  return adjacentLocations.map(l => store.getPlayerAtLocation(l)).filter(p => p !== undefined) as FieldedPlayer[];
}

function isPlayerAdjacent(source: FieldedPlayer, target: FieldedPlayer): boolean {
  return getAdjacentPlayers(source).filter(p => p.id === target.id).length > 0;
}

function getBlockAssists(): Array<{ source: FieldedPlayer, target: FieldedPlayer, offensiveAssists: number, defensiveAssists: number }> {
  const assists: Array<{ source: FieldedPlayer, target: FieldedPlayer, offensiveAssists: number, defensiveAssists: number }> = [];
  for(const offensivePlayer of offensePlayers.value)
  {
    for(const defensePlayer of defensePlayers.value)
    {
      if(isPlayerAdjacent(offensivePlayer, defensePlayer))
      {
        assists.push({source: offensivePlayer, target: defensePlayer, ...getBlockAssistInfo(offensivePlayer, defensePlayer)});
        assists.push({source: defensePlayer, target: offensivePlayer, ...getBlockAssistInfo(defensePlayer, offensivePlayer)});
      }
    }
  }
  return assists;
}

function getBlockAssistInfo(source: FieldedPlayer, target: FieldedPlayer): { offensiveAssists: number; defensiveAssists: number}{
  const offensiveAssists = getAdjacentPlayers(target).filter(p => p.teamName === source.teamName).filter(p => getAdjacentPlayers(p).filter(m => m.teamName === target.teamName).length === 0).length;;
  const defensiveAssists = getAdjacentPlayers(source).filter(p => p.teamName === target.teamName).filter(p => getAdjacentPlayers(p).filter(m => m.teamName === source.teamName).length === 0).length;
  return {offensiveAssists, defensiveAssists};
}

function getDodgeModifierInfo(location: PitchCoordinates): { offensiveModifier: number, defensiveModifier: number } | null {
  const player = store.getPlayerAtLocation(location);
  if(player)
  {
    return null;
  }
  const adjacentPlayers = getAdjacentPlayers(location);
  const offensiveModifier = adjacentPlayers.filter(p => p.teamName === selectedOffenseTeam.value).length;
  const defensiveModifier = adjacentPlayers.filter(p => p.teamName === selectedDefenseTeam.value).length;
  return {offensiveModifier, defensiveModifier}; 
}

function getDodgeModifiers(): Array<PitchCoordinates &{ offensiveModifier: number, defensiveModifier: number }> {
  const modifiers: Array<PitchCoordinates &{ offensiveModifier: number, defensiveModifier: number }> = [];
  for(const location of pitchLocations.value)
  {
    const modifierInfo = getDodgeModifierInfo(location);
    if(modifierInfo)
    {
      modifiers.push({...location, ...modifierInfo});
    }
  }
  return modifiers;
}

</script>
