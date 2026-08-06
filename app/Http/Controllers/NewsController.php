<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class NewsController extends Controller
{
    public function show($slug)
    {
        $articles = [
            'mindanao-earthquake-magnitude-7-8' => [
                'title' => 'Ilang Lugar sa Mindanao Niyanig ng Magnitude 7.8 na Lindol; Libo-libong Residente Apektado',
                'date' => 'July 19, 2026',
                'img' => 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSuMW4DW0hX9_FTkJdmR4kHVbd-1cmZg_mgkhOiftCSaU5E7aY-ApJFlzw&s=10',
                'video' => 'https://www.youtube.com/watch?v=bb8fB236rz8',
                'content' => "Isang malakas na magnitude 7.8 na lindol ang yumanig sa ilang bahagi ng Mindanao, na nagdulot ng matinding pagyanig, pinsala sa mga imprastraktura, at malawakang paglikas ng mga residente sa mga apektadong lugar. Agad na naglabas ng mga babala ang mga awtoridad habang nagsagawa ng rapid damage assessment at search and rescue operations.

Ayon sa mga inisyal na ulat, naramdaman ang malakas na pagyanig sa iba't ibang lalawigan sa Mindanao, kabilang ang mga lugar na malapit sa epicenter. Ilang gusali, kalsada, at iba pang imprastraktura ang nagtamo ng pinsala, habang pansamantalang sinuspinde ang klase at ilang operasyon ng pamahalaan bilang pag-iingat.

Nagbabala rin ang mga kinauukulang ahensya sa posibilidad ng malalakas na aftershocks. Pinayuhan ang publiko na manatiling alerto, umiwas sa mga gusaling may pinsala, at sundin ang mga abiso ng lokal na pamahalaan at disaster response agencies upang matiyak ang kanilang kaligtasan.

Patuloy namang nagsasagawa ng inspeksyon ang mga rescue teams at engineering personnel upang matukoy ang lawak ng pinsala. Kasabay nito, inihahanda rin ang relief operations para sa mga residenteng pansamantalang inilikas sa mga evacuation center. Ayon sa mga paunang ulat, may mga nasawi at nasugatan sa insidente habang patuloy pang bineberipika ang kabuuang bilang ng mga naapektuhan.

Hinihikayat ng mga opisyal ang publiko na kumuha lamang ng impormasyon mula sa mga opisyal na anunsyo upang maiwasan ang pagkalat ng maling balita. Patuloy ring mino-monitor ang sitwasyon habang inaasahan ang karagdagang ulat hinggil sa epekto ng lindol sa mga komunidad sa Mindanao.

Keywords: Mindanao earthquake, Magnitude 7.8, Mindanao news, lindol sa Pilipinas, breaking news, aftershocks, disaster response, TV Patrol.",
            ],
            'volunteers-complete-bls-training' => [
                'title' => 'New Volunteers Complete Basic Life Support Training',
                'date' => 'MAY 28, 2026',
                'img' => 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&h=600&fit=crop',
                'video' => 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                'content' => "A fresh batch of Red Cross 143 volunteers has completed their Basic Life Support (BLS) certification, marking another milestone for the chapter's volunteer program.\nThe training covered CPR techniques, emergency response protocols, and hands-on simulations led by certified instructors.\nThese newly certified volunteers are now ready to assist in community health initiatives and emergency response operations across Muntinlupa City.",
            ],
            'disaster-preparedness-seminar-schools' => [
                'title' => 'Disaster Preparedness Seminar Held for Local Schools',
                'date' => 'MAY 15, 2026',
                'img' => 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=1200&h=600&fit=crop',
                'video' => 'https://www.youtube.com/embed/dQw4w9WgXcQ',
                'content' => "Students and teachers from several Muntinlupa schools took part in a disaster preparedness seminar ahead of the upcoming rainy season.\nThe seminar covered evacuation procedures, emergency kit essentials, and basic first aid — equipping the school community with practical knowledge for handling emergencies.\nThe Philippine Red Cross Muntinlupa Chapter plans to continue this initiative across more schools in the coming months.",
            ],
        ];

        abort_unless(isset($articles[$slug]), 404);

        return Inertia::render('NewsShow', [
            'article' => $articles[$slug],
        ]);
    }
}