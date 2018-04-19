#!/bin/bash


function print_usage() {

cat <<HERE

  Usage: $0 [--help] [-s DIR] [-e EXT] [-s SKIP] [-h HOST] 
                     [-w WAIT] [-m MOVE]

     DIR    : Folder to scan for files      (default: examples/mhc)
     EXT    : File extensions to scan for   (default: xml)
     SKIP   : Skip count                    (default: 0)
     HOST   : Host to post XML content to   (default: http://localhost:7890/)
     WAIT   : Seconds to wait between POSTs (default: 3)
     MOVE   : Folder to move files in       (default: examples/readin)

HERE
}

ERR=false

while [ $# -gt 0 ]; do
		case $1 in
				--help)
						print_usage
						exit 0
						;;
		esac

		if [ $# -eq 1 ]; then
						echo "Wrong argument count."
						print_usage
						exit 1
		fi
		
		case $1 in
				-d)
						DIR=$2
						shift 2
						;;
				-s)
						SKIP=$2
						shift 2
						;;
				-h)
						HOST=$2
						shift 2
						;;
				-e)
						EXT=$2
						shift 2
						;;
			  -w)
						WAIT=$2
						shift 2
						;;
				-m)
						MOVE=$2
						if [ -n "$MOVE" ]; then
										if [ ! -d "$MOVE" ]; then
														echo "Folder des not exist, creating it"
														mkdir -p "$MOVE"
										fi
						fi
						shift 2
						;;
				*)
						echo "Unknown Parameter $1"
						ERR=true
						shift
						;;
		esac
done

if $ERR; then
		echo "Errors occured"
		exit 1
fi

DIR=${DIR:-examples/mhc/}
SKIP=${SKIP:-0}
HOST=${HOST:-http://localhost:7890/}
EXT=${EXT:-xml}
WAIT=${WAIT:-3}

echo "Agruments:"
echo "  Source Dir    : $DIR"
echo "  Skipping files: $SKIP"
echo "  iobroker host : $HOST"
echo "  Extension     : $EXT"
echo "  Wait time     : $WAIT"
echo "  Move folder   : $MOVE $([ -d "$MOVE" ] && echo "(exists)" || echo "(not exists)")"

COUNT=$(find $DIR -iname "*.${EXT}" | wc -l)

echo "  Count files   : $COUNT"

if [ $COUNT -lt $SKIP ]; then
				echo "Skip is larger than total filecount..."
				exit 2
fi

CNTR=0
while read afile
do

				let CNTR++
				printf "[%5d/%5d] %s " "$CNTR" "$COUNT" "$afile"
				if [ $CNTR -lt $SKIP ]; then
								echo -n " Skipping"
								if [ -d "$MOVE" ]; then
												echo " moving"
												mv ${afile} "${MOVE}"
								else
												echo ""
								fi
								continue
				fi

				CURLOUT=$(curl -s -X POST -w "%{http_code}" -d @${afile} ${HOST} | tail -n 1)
				CURLSTAT=$?
				echo -n "(${CURLOUT})"
				if [ ${CURLSTAT} -eq 0 -a ${CURLOUT} -eq 200 ]; then
								if [ -d "$MOVE" ]; then
												echo -n " moving"
												mv ${afile} "${MOVE}"
								fi
								echo " OK"
				else
								echo " Error"
								[ -d "$MOVE" ] && echo -n "  Not moved due to error"
								echo " - Aborting!"
								exit 1
				fi
				sleep $WAIT

done < <(find $DIR -iname "*.${EXT}")
