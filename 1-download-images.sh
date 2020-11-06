#!/bin/bash
# Go there https://arts.konbini.com/photo/dans-27-pays-differents-des-designers-ont-retouche-deux-visages-selon-leurs-ideaux/
# copy this : copy(Array.from(document.querySelectorAll(".wp-caption > img")).map(el => el.src).join(" "))
# open the console, paste it
# then paste urls below

urls="https://cdn-arts.konbini.com/files/2019/10/image-de-base.jpg https://cdn-arts.konbini.com/files/2019/10/afrique-du-sud.jpg https://cdn-arts.konbini.com/files/2019/10/albanie.jpg https://cdn-arts.konbini.com/files/2019/10/allemagne.jpg https://cdn-arts.konbini.com/files/2019/10/australie.jpg https://cdn-arts.konbini.com/files/2019/10/bielorussie.jpg https://cdn-arts.konbini.com/files/2019/10/bosnie.jpg https://cdn-arts.konbini.com/files/2019/10/costa-rica.jpg https://cdn-arts.konbini.com/files/2019/10/croatie.jpg https://cdn-arts.konbini.com/files/2019/10/egypte.jpg https://cdn-arts.konbini.com/files/2019/10/emirats-arabes-unis.jpg https://cdn-arts.konbini.com/files/2019/10/finlande.jpg https://cdn-arts.konbini.com/files/2019/10/france.jpg https://cdn-arts.konbini.com/files/2019/10/hong-kong.jpg https://cdn-arts.konbini.com/files/2019/10/inde.jpg https://cdn-arts.konbini.com/files/2019/10/israel.jpg https://cdn-arts.konbini.com/files/2019/10/lituanie.jpg https://cdn-arts.konbini.com/files/2019/10/malaisie.jpeg https://cdn-arts.konbini.com/files/2019/10/mexique.jpg https://cdn-arts.konbini.com/files/2019/10/namibie.jpeg https://cdn-arts.konbini.com/files/2019/10/pologne.jpg https://cdn-arts.konbini.com/files/2019/10/qatar.jpg https://cdn-arts.konbini.com/files/2019/10/russie.jpg https://cdn-arts.konbini.com/files/2019/10/serbie.jpg https://cdn-arts.konbini.com/files/2019/10/turquie.jpg"
mkdir -p source-images
cd source-images
for url in $urls
do
   curl -O "$url"
done
cd ..
