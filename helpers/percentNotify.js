import {supabase} from "../supabase/index.js";

async function percentNotify(tgId) {
	const {data: userPercentNotify} = await supabase.from('tg_users').select('percent_notify').eq('tg_id', tgId);
	return userPercentNotify[0].percent_notify
}

export default percentNotify
