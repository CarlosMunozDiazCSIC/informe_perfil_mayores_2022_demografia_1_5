//Desarrollo de las visualizaciones
import * as d3 from 'd3';
require('./sellect');
import { numberWithCommas2 } from '../helpers';
//import { getInTooltip, getOutTooltip, positionTooltip } from './modules/tooltip';
import { setChartHeight } from '../modules/height';
import { setChartCanvas, setChartCanvasImage, setCustomCanvas, setChartCustomCanvasImage } from '../modules/canvas-image';
import { setRRSSLinks } from '../modules/rrss';
import { setFixedIframeUrl } from './chart_helpers';

//Colores fijos
const COLOR_PRIMARY_1 = '#F8B05C', 
COLOR_PRIMARY_2 = '#E37A42', 
COLOR_ANAG_1 = '#D1834F', 
COLOR_ANAG_2 = '#BF2727', 
COLOR_COMP_1 = '#528FAD', 
COLOR_COMP_2 = '#AADCE0', 
COLOR_GREY_1 = '#B5ABA4', 
COLOR_GREY_2 = '#64605A', 
COLOR_OTHER_1 = '#B58753', 
COLOR_OTHER_2 = '#731854';

export function initChart(iframe) {
    //Creación de otros elementos relativos al gráfico que no requieran lectura previa de datos > Selectores múltiples o simples, timelines, etc 

    //Lectura de datos
    d3.csv('https://raw.githubusercontent.com/CarlosMunozDiazCSIC/informe_perfil_mayores_2022_demografia_1_6/main/data/piramide_2021_tamanos_municipios.csv', function(error,data) {
        if (error) throw error;

        //SELECCIÓN DE ELEMENTOS
        let selectedArr = ['nacional'];
        let mySellect = sellect("#my-element", {
            originList: ['nacional','entre0y100','entre101y500','entre501y1000','entre1001y2000','entre2001y5000','entre5001y10000','entre10001y20000','entre20001y50000','entre50001y100000','entre100001y500000','500001ymas'],
            destinationList: ['nacional'],
            onInsert: onChange,
            onRemove: onChange
        });

        function onChange() {
            selectedArr = mySellect.getSelected();
            setPyramids(selectedArr);
        }

        mySellect.init();

        /////////////////VISUALIZACIÓN DE PIRÁMIDES///////////////
        ///Dividir los datos
        let currentType = 'Porcentajes';

        ///Valores iniciales de altura, anchura y márgenes > Primer desarrollo solo con Valores absolutos
        let margin = {top: 5, right: 25, bottom: 20, left: 90},
            width = document.getElementById('chart').clientWidth - margin.left - margin.right,
            height = document.getElementById('chart').clientHeight - margin.top - margin.bottom;

        let svg = d3.select("#chart")
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        let x = d3.scaleLinear()
            .domain([-1.5,1.5])
            .range([0,width]);

        let xM = d3.scaleLinear()
            .domain([1.5,0])
            .range([0, width / 2]);

        let xF = d3.scaleLinear()
            .domain([0,1.5])
            .range([width / 2, width]);

        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .attr('class','x-axis')
            .call(d3.axisBottom(x));

        let y = d3.scaleBand()
            .range([ 0, height ])
            .domain(dataAbsolutoEspanol.map(function(item) { return item.Edad; }).reverse())
            .padding(.1);

        svg.append("g")
            .call(d3.axisLeft(y));

        function setPyramids(types, currentType) {

            if (currentType == 'Absolutos') {
                x.domain([-500000,500000]);
                svg.select(".x-axis").call(d3.axisBottom(x));                
                xM.domain([500000,0]);
                xF.domain([0,500000]);
            } else {
                x.domain([-1.5,1.5]);
                svg.select(".x-axis").call(d3.axisBottom(x));
                xM.domain([1.5,0]);
                xF.domain([0,1.5]);
            }

            for (let i = 0; i < types.length; i++) {

                let auxData = data.filter(function(item) { if (item.Tipo == types[i] && item.Data == currentType) { return item; }});

                svg.selectAll('.chart-g')
                    .remove();

                svg.append("g")
                    .attr('class', 'chart-g')
                    .selectAll("rect")
                    .data(auxData)
                    .enter()
                    .append("rect")
                    .attr('class', 'prueba')
                    .attr("fill", function(d) { if(d.Sexo == 'Hombres') { return COLOR_PRIMARY_1; } else { return COLOR_COMP_1; }})
                    .style('opacity', '0.8')
                    .attr("x", function(d) { if(d.Sexo == 'Hombres') { return xM(d.Valor); } else { return xF(0); }})
                    .attr("y", function(d) { return y(d.Edad); })
                    .attr("width", function(d) { if(d.Sexo == 'Hombres') { return xM(0) - xM(d.Valor); } else { return xF(d.Valor) - xF(0); }})
                    .attr("height", y.bandwidth());
            }

        }

        ////////////
        ////////////RESTO
        ////////////
        setPyramids(selectedArr, currentType);

        //Uso de dos botones para ofrecer datos absolutos y en miles
        document.getElementById('data_absolutos').addEventListener('click', function() {
            //Cambiamos color botón
            document.getElementById('data_porcentajes').classList.remove('active');
            document.getElementById('data_absolutos').classList.add('active');

            //Cambiamos valor actual
            currentType = 'Absolutos';

            //Cambiamos gráfico
            setPyramids(selectedArr, currentType);            
        });

        document.getElementById('data_porcentajes').addEventListener('click', function() {
            //Cambiamos color botón
            document.getElementById('data_porcentajes').classList.add('active');
            document.getElementById('data_absolutos').classList.remove('active');

            //Cambiamos valor actual
            currentType = 'Porcentajes';

            //Cambiamos gráfico
            setPyramids(selectedArr, currentType);            
        });

        //Animación del gráfico
        document.getElementById('replay').addEventListener('click', function() {
            //animateChart();
            console.log("Intento de animación")
        });

        //Iframe
        setFixedIframeUrl('informe_perfil_mayores_2022_demografia_1_6','piramide_espanoles_extranjeros');

        //Redes sociales > Antes tenemos que indicar cuál sería el texto a enviar
        setRRSSLinks('piramide_espanoles_extranjeros');

        //Captura de pantalla de la visualización
        setChartCanvas();
        setCustomCanvas();

        let pngDownload = document.getElementById('pngImage');

        pngDownload.addEventListener('click', function(){
            setChartCanvasImage('piramide_espanoles_extranjeros');
            setChartCustomCanvasImage('piramide_espanoles_extranjeros');
        });

        //Altura del frame
        setChartHeight(iframe);
    });    
}