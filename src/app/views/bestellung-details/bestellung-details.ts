import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {RouteParams} from '../../models/enums/RouteParams';

@Component({
  selector: 'app-bestellung-details',
  imports: [],
  templateUrl: './bestellung-details.html',
  styleUrl: './bestellung-details.css',
})
export class BestellungDetails implements OnInit{

  constructor(private route: ActivatedRoute){

  }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get(RouteParams.BESTELLUNGS_ID);
      console.log(id);
    });
  }
}
