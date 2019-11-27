<?php
  $clientData = json_decode($_POST['data'], true);

  if($clientData && $clentData !== []) {
    $data = json_decode(file_get_contents('data.json'), true);
    foreach ($clientData as $el) {
      $data[$el[0]][$el[1]] = $el[2];
    }
    file_put_contents('data.json', json_encode($data));
    echo json_encode($data);
  }

  else {
    echo file_get_contents('data.json');
  }


?>
