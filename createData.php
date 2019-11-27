<?php

  $data = [];

  for ($i=0; $i < 100; $i++) {
    $data[$i] = [];
    for ($j=0; $j < 100; $j++) {
      $data[$i][$j] = 'white';
    }
  }


  file_put_contents('data.json', json_encode($data));
?>
