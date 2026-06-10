import type { MatchWithDetails, GroupStanding, BracketMatch, LeaderboardRow } from "./types";

export const MOCK_MATCHES: MatchWithDetails[] = [
  {
    id:"m1",stage:"group",group_id:"A",kickoff_utc:"2026-06-11T06:45:00Z",predictions_locked:false,
    team_a:{id:"bra",name:"Brazil",flag:"🇧🇷",elo_rank:1},
    team_b:{id:"mex",name:"Mexico",flag:"🇲🇽",elo_rank:14},
    result:null,my_pick:null,
    predictions:[
      {user_id:"u1",username:"Sunless Model",is_model:true,model_color:"blue",p_win:0.61,p_draw:0.22,p_loss:0.17},
      {user_id:"u2",username:"Frank Model",is_model:true,model_color:"red",p_win:0.58,p_draw:0.24,p_loss:0.18},
    ],
  },
  {
    id:"m2",stage:"group",group_id:"A",kickoff_utc:"2026-06-11T09:45:00Z",predictions_locked:false,
    team_a:{id:"ger",name:"Germany",flag:"🇩🇪",elo_rank:4},
    team_b:{id:"jpn",name:"Japan",flag:"🇯🇵",elo_rank:22},
    result:null,my_pick:"win",
    predictions:[
      {user_id:"u1",username:"Sunless Model",is_model:true,model_color:"blue",p_win:0.52,p_draw:0.26,p_loss:0.22},
      {user_id:"u2",username:"Frank Model",is_model:true,model_color:"red",p_win:0.55,p_draw:0.23,p_loss:0.22},
    ],
  },
  {
    id:"m3",stage:"group",group_id:"B",kickoff_utc:"2026-06-12T09:00:00Z",predictions_locked:true,
    team_a:{id:"fra",name:"France",flag:"🇫🇷",elo_rank:2},
    team_b:{id:"arg",name:"Argentina",flag:"🇦🇷",elo_rank:3},
    result:null,my_pick:"win",
    predictions:[
      {user_id:"u1",username:"Sunless Model",is_model:true,model_color:"blue",p_win:0.44,p_draw:0.28,p_loss:0.28},
      {user_id:"u2",username:"Frank Model",is_model:true,model_color:"red",p_win:0.41,p_draw:0.30,p_loss:0.29},
    ],
  },
  {
    id:"m4",stage:"group",group_id:"C",kickoff_utc:"2026-06-10T08:45:00Z",predictions_locked:true,
    team_a:{id:"eng",name:"England",flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",elo_rank:5},
    team_b:{id:"usa",name:"USA",flag:"🇺🇸",elo_rank:11},
    result:{goals_a:2,goals_b:1,outcome:"win"},my_pick:"win",
    predictions:[
      {user_id:"u1",username:"Sunless Model",is_model:true,model_color:"blue",p_win:0.49,p_draw:0.27,p_loss:0.24},
      {user_id:"u2",username:"Frank Model",is_model:true,model_color:"red",p_win:0.51,p_draw:0.26,p_loss:0.23},
    ],
  },
  {
    id:"m5",stage:"group",group_id:"D",kickoff_utc:"2026-06-13T06:45:00Z",predictions_locked:false,
    team_a:{id:"esp",name:"Spain",flag:"🇪🇸",elo_rank:6},
    team_b:{id:"mar",name:"Morocco",flag:"🇲🇦",elo_rank:13},
    result:null,my_pick:null,
    predictions:[
      {user_id:"u1",username:"Sunless Model",is_model:true,model_color:"blue",p_win:0.54,p_draw:0.25,p_loss:0.21},
      {user_id:"u2",username:"Frank Model",is_model:true,model_color:"red",p_win:0.50,p_draw:0.27,p_loss:0.23},
    ],
  },
];

export const MOCK_STANDINGS: Record<string, GroupStanding[]> = {
  A:[
    {team:{id:"bra",name:"Brazil",flag:"🇧🇷"},played:2,won:2,drawn:0,lost:0,gf:4,ga:1,points:6,qualified:true},
    {team:{id:"ger",name:"Germany",flag:"🇩🇪"},played:2,won:1,drawn:0,lost:1,gf:3,ga:2,points:3,qualified:false},
    {team:{id:"mex",name:"Mexico",flag:"🇲🇽"},played:2,won:0,drawn:1,lost:1,gf:1,ga:2,points:1,qualified:false},
    {team:{id:"jpn",name:"Japan",flag:"🇯🇵"},played:2,won:0,drawn:1,lost:1,gf:1,ga:4,points:1,qualified:false},
  ],
  B:[
    {team:{id:"fra",name:"France",flag:"🇫🇷"},played:2,won:1,drawn:1,lost:0,gf:3,ga:1,points:4,qualified:true},
    {team:{id:"arg",name:"Argentina",flag:"🇦🇷"},played:2,won:1,drawn:1,lost:0,gf:2,ga:1,points:4,qualified:true},
    {team:{id:"pol",name:"Poland",flag:"🇵🇱"},played:2,won:0,drawn:0,lost:2,gf:0,ga:2,points:0,qualified:false},
    {team:{id:"sen",name:"Senegal",flag:"🇸🇳"},played:2,won:0,drawn:0,lost:2,gf:1,ga:2,points:0,qualified:false},
  ],
  C:[
    {team:{id:"eng",name:"England",flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿"},played:2,won:2,drawn:0,lost:0,gf:4,ga:1,points:6,qualified:true},
    {team:{id:"usa",name:"USA",flag:"🇺🇸"},played:2,won:1,drawn:0,lost:1,gf:2,ga:2,points:3,qualified:false},
    {team:{id:"ira",name:"Iran",flag:"🇮🇷"},played:2,won:0,drawn:1,lost:1,gf:1,ga:2,points:1,qualified:false},
    {team:{id:"wal",name:"Wales",flag:"🏴󠁧󠁢󠁷󠁬󠁳󠁿"},played:2,won:0,drawn:1,lost:1,gf:1,ga:3,points:1,qualified:false},
  ],
  D:[
    {team:{id:"esp",name:"Spain",flag:"🇪🇸"},played:1,won:1,drawn:0,lost:0,gf:3,ga:0,points:3,qualified:false},
    {team:{id:"mar",name:"Morocco",flag:"🇲🇦"},played:1,won:0,drawn:1,lost:0,gf:1,ga:1,points:1,qualified:false},
    {team:{id:"cro",name:"Croatia",flag:"🇭🇷"},played:1,won:0,drawn:1,lost:0,gf:1,ga:1,points:1,qualified:false},
    {team:{id:"can",name:"Canada",flag:"🇨🇦"},played:1,won:0,drawn:0,lost:1,gf:0,ga:3,points:0,qualified:false},
  ],
};

export const MOCK_BRACKET: Record<string, BracketMatch[]> = {
  r32:[
    {id:"r32_1",stage:"r32",team_a:{id:"bra",name:"Brazil",flag:"🇧🇷"},team_b:{id:"mar",name:"Morocco",flag:"🇲🇦"},winner_id:"bra",model_p_win:0.68},
    {id:"r32_2",stage:"r32",team_a:{id:"fra",name:"France",flag:"🇫🇷"},team_b:{id:"usa",name:"USA",flag:"🇺🇸"},winner_id:"fra",model_p_win:0.61},
    {id:"r32_3",stage:"r32",team_a:{id:"ger",name:"Germany",flag:"🇩🇪"},team_b:{id:"sen",name:"Senegal",flag:"🇸🇳"},winner_id:null,model_p_win:0.64},
    {id:"r32_4",stage:"r32",team_a:{id:"esp",name:"Spain",flag:"🇪🇸"},team_b:{id:"jpn",name:"Japan",flag:"🇯🇵"},winner_id:null,model_p_win:0.59},
  ],
  r16:[
    {id:"r16_1",stage:"r16",team_a:{id:"bra",name:"Brazil",flag:"🇧🇷"},team_b:{id:"fra",name:"France",flag:"🇫🇷"},winner_id:null,model_p_win:0.52},
    {id:"r16_2",stage:"r16",team_a:null,team_b:null,winner_id:null,model_p_win:null},
  ],
  qf:[{id:"qf_1",stage:"qf",team_a:null,team_b:null,winner_id:null,model_p_win:null}],
  sf:[{id:"sf_1",stage:"sf",team_a:null,team_b:null,winner_id:null,model_p_win:null}],
  final:[{id:"final_1",stage:"final",team_a:null,team_b:null,winner_id:null,model_p_win:null}],
};

export const MOCK_LEADERBOARD: LeaderboardRow[] = [
  {rank:1,user_id:"u1",username:"Sunless Model",is_model:true,model_color:"blue",cumulative_rps:0.162,matches_predicted:4,accuracy:0.75},
  {rank:2,user_id:"u2",username:"Frank Model",is_model:true,model_color:"red",cumulative_rps:0.171,matches_predicted:4,accuracy:0.70},
  {rank:3,user_id:"u3",username:"Sunless",is_model:false,model_color:null,cumulative_rps:0.181,matches_predicted:4,accuracy:0.68},
  {rank:4,user_id:"u4",username:"Arun",is_model:false,model_color:null,cumulative_rps:0.194,matches_predicted:3,accuracy:0.65},
  {rank:5,user_id:"u5",username:"Priya",is_model:false,model_color:null,cumulative_rps:0.201,matches_predicted:4,accuracy:0.62},
  {rank:6,user_id:"u6",username:"Rohan",is_model:false,model_color:null,cumulative_rps:0.218,matches_predicted:3,accuracy:0.58},
];
