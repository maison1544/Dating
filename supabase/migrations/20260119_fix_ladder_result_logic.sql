-- Fix ladder game result generation
-- Valid combinations only: 좌3짝, 좌4홀, 우3홀, 우4짝
-- Applied: 2026-01-19

CREATE OR REPLACE FUNCTION public.game_generate_result_ladder()
RETURNS jsonb
LANGUAGE plpgsql
AS $function$
declare
  v_start_pos text;
  v_line_count int;
  v_odd_even text;
begin
  -- Randomly choose start position (left or right)
  v_start_pos := case when random() < 0.5 then 'left' else 'right' end;
  
  -- Randomly choose line count (3 or 4)
  v_line_count := case when random() < 0.5 then 3 else 4 end;
  
  -- oddEven is determined by the combination of start position and line count
  -- 좌3짝, 좌4홀, 우3홀, 우4짝
  if v_start_pos = 'left' then
    v_odd_even := case when v_line_count = 3 then 'even' else 'odd' end;
  else
    v_odd_even := case when v_line_count = 3 then 'odd' else 'even' end;
  end if;

  return jsonb_build_object(
    'startPosition', v_start_pos,
    'lineCount', v_line_count,
    'oddEven', v_odd_even,
    'result', v_start_pos
  );
end;
$function$;
